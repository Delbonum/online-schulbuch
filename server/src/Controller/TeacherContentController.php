<?php

declare(strict_types=1);

namespace Schulbuch\Controller;

use Schulbuch\Http\HttpException;
use Schulbuch\Http\Response;
use Schulbuch\Service\Auth;

/**
 * Inhalte für Lehrkräfte im Schulbuch. Sie liegen verschlüsselt in den statischen Seiten
 * (siehe scripts/build.mjs); den Schlüssel bekommen nur angemeldete Lehrkräfte.
 */
final class TeacherContentController
{
    public function __construct(
        private Auth $auth,
        private string $contentKey,
    ) {
    }

    public function key(): Response
    {
        $this->auth->requireTeacher();
        if ($this->contentKey === '') {
            throw new HttpException(503, 'Die Inhalte für Lehrkräfte sind auf dem Server nicht eingerichtet.');
        }
        return Response::json(['key' => $this->contentKey]);
    }
}
