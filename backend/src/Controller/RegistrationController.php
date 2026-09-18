<?php

declare(strict_types=1);

namespace Kryptogame\Controller;

use Kryptogame\Http\HttpException;
use Kryptogame\Http\Request;
use Kryptogame\Http\Response;
use Kryptogame\Repository\RegistrationRepository;
use Kryptogame\Repository\UserRepository;
use Kryptogame\Service\Auth;
use Kryptogame\Service\Mailer;
use Kryptogame\Service\Validator;

/**
 * Registrierung neuer Lehrkräfte. Eine Anfrage wird erst zu einem Konto,
 * wenn das Master-Konto sie freigibt – per Link in der E-Mail oder im Dashboard.
 */
final class RegistrationController
{
    public function __construct(
        private Auth $auth,
        private RegistrationRepository $registrations,
        private UserRepository $users,
        private Mailer $mailer,
        private string $adminEmail,
        private string $appUrl,
    ) {
    }

    public function register(Request $request): Response
    {
        $body = $request->json();
        $username = Validator::username($body['username'] ?? null);
        $password = Validator::password($body['password'] ?? null);
        $fullName = Validator::text($body['fullName'] ?? null, 'Name');
        $school = Validator::text($body['school'] ?? null, 'Schule');
        $city = Validator::text($body['city'] ?? null, 'Ort');
        $email = Validator::email($body['email'] ?? null);

        if ($this->users->usernameExists($username) || $this->registrations->pendingUsernameExists($username)) {
            throw HttpException::conflict('Dieser Benutzername ist bereits vergeben.');
        }

        $this->registrations->deleteExpired();

        $created = $this->registrations->create([
            'username' => $username,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'full_name' => $fullName,
            'school' => $school,
            'city' => $city,
            'email' => $email,
        ]);

        $this->notifyAdmin($created, $username, $fullName, $school, $city, $email);

        return Response::json([
            'status' => 'pending',
            'message' => 'Deine Registrierung wurde übermittelt. Du bekommst eine E-Mail, sobald sie freigegeben ist.',
        ], 202);
    }

    /** Entscheidung über den Link aus der E-Mail (wird im Browser geöffnet). */
    public function decideByToken(Request $request, array $params): Response
    {
        $registration = $this->registrations->findByToken((string) $params['token']);
        $decision = $params['decision'] === 'approve' ? 'approved' : 'rejected';

        if ($registration === null) {
            return Response::html($this->page('Unbekannter Link', 'Diese Registrierung gibt es nicht (mehr).'), 404);
        }
        if ($registration['status'] !== 'pending') {
            return Response::html($this->page(
                'Bereits bearbeitet',
                'Diese Registrierung wurde bereits ' . ($registration['status'] === 'approved' ? 'freigegeben' : 'abgelehnt') . '.',
            ));
        }

        $this->decide($registration, $decision, null);

        return Response::html($this->page(
            $decision === 'approved' ? 'Registrierung freigegeben' : 'Registrierung abgelehnt',
            $decision === 'approved'
                ? sprintf('Das Konto „%s“ wurde angelegt. Die Lehrkraft wurde per E-Mail informiert.', $registration['username'])
                : sprintf('Die Anfrage von „%s“ wurde abgelehnt.', $registration['username']),
        ));
    }

    /** Liste für das Master-Konto. */
    public function index(): Response
    {
        $this->auth->requireMaster();
        // Bearbeitete Anfragen werden nach einem Jahr automatisch gelöscht
        $this->registrations->deleteExpired();
        return Response::json([
            'registrations' => array_map(static fn (array $row): array => [
                'id' => $row['id'],
                'username' => $row['username'],
                'fullName' => $row['full_name'],
                'school' => $row['school'],
                'city' => $row['city'],
                'email' => $row['email'],
                'status' => $row['status'],
                'createdAt' => \Kryptogame\Database::toIso((string) $row['created_at']),
            ], $this->registrations->all()),
        ]);
    }

    /** @param array<string, string> $params */
    public function decideAsMaster(Request $request, array $params): Response
    {
        $master = $this->auth->requireMaster();
        $registration = $this->registrations->find(Validator::positiveInt($params['id'], 'ID'));
        if ($registration === null) {
            throw HttpException::notFound('Registrierung nicht gefunden.');
        }
        if ($registration['status'] !== 'pending') {
            throw HttpException::conflict('Diese Registrierung wurde bereits bearbeitet.');
        }

        $decision = $params['decision'] === 'approve' ? 'approved' : 'rejected';
        $this->decide($registration, $decision, $master['id']);

        return Response::json(['status' => $decision]);
    }

    /**
     * @param array<string, mixed> $registration
     */
    private function decide(array $registration, string $decision, ?int $actorId): void
    {
        if ($decision === 'approved') {
            // Falls der Name inzwischen vergeben ist, bekommt die Lehrkraft eine Absage mit Hinweis
            if ($this->users->usernameExists($registration['username'])) {
                $this->registrations->decide($registration['id'], 'rejected', $actorId);
                $this->mailer->send(
                    (string) $registration['email'],
                    'KryptoGAME: Registrierung nicht möglich',
                    "Hallo {$registration['full_name']},\n\n"
                        . "der Benutzername „{$registration['username']}“ ist inzwischen vergeben. "
                        . "Bitte registriere dich noch einmal mit einem anderen Benutzernamen.\n\n"
                        . "Viele Grüße\nKryptoGAME",
                );
                return;
            }

            $this->users->create(
                (string) $registration['username'],
                (string) $registration['password_hash'],
                'teacher',
                null,
            );
            $this->registrations->decide($registration['id'], 'approved', $actorId);
            $this->mailer->send(
                (string) $registration['email'],
                'KryptoGAME: Dein Zugang ist freigeschaltet',
                "Hallo {$registration['full_name']},\n\n"
                    . "dein Lehrkräfte-Zugang für die Krypto-Zeitreise ist freigeschaltet.\n"
                    . "Du kannst dich jetzt mit dem Benutzernamen „{$registration['username']}“ und deinem Passwort anmelden:\n"
                    . $this->appUrl . "\n\n"
                    . "Viele Grüße\nKryptoGAME",
            );
            return;
        }

        $this->registrations->decide($registration['id'], 'rejected', $actorId);
        $this->mailer->send(
            (string) $registration['email'],
            'KryptoGAME: Registrierung abgelehnt',
            "Hallo {$registration['full_name']},\n\n"
                . "deine Registrierung für die Krypto-Zeitreise wurde leider nicht freigegeben.\n"
                . "Bei Fragen antworte einfach auf diese E-Mail.\n\n"
                . "Viele Grüße\nKryptoGAME",
        );
    }

    /**
     * @param array{id: int, token: string} $created
     */
    private function notifyAdmin(array $created, string $username, string $fullName, string $school, string $city, string $email): void
    {
        if ($this->adminEmail === '') {
            return;
        }
        $base = rtrim($this->appUrl, '/') . '/api/register/' . $created['token'];
        $this->mailer->send(
            $this->adminEmail,
            'KryptoGAME: neue Lehrkräfte-Registrierung',
            "Es liegt eine neue Registrierung vor:\n\n"
                . "Name:          {$fullName}\n"
                . "Benutzername:  {$username}\n"
                . "Schule:        {$school}\n"
                . "Ort:           {$city}\n"
                . "E-Mail:        {$email}\n\n"
                . "Freigeben:  {$base}/approve\n"
                . "Ablehnen:   {$base}/reject\n\n"
                . "Alternativ kannst du die Anfrage im Dashboard bearbeiten.",
        );
    }

    private function page(string $title, string $text): string
    {
        $escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
            . '<title>' . $escape($title) . '</title>'
            . '<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5}'
            . 'h1{font-size:1.3rem}</style></head><body><h1>' . $escape($title) . '</h1><p>' . $escape($text) . '</p>'
            . '<p><a href="' . $escape($this->appUrl) . '">Zur Krypto-Zeitreise</a></p></body></html>';
    }
}
