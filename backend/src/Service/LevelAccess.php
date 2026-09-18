<?php

declare(strict_types=1);

namespace Kryptogame\Service;

/**
 * Regel für die Freischaltung: Ein Level ist offen, wenn das letzte davor
 * liegende *verpflichtende* Level bestanden wurde. Als optional markierte Level
 * werden dabei übersprungen.
 */
final class LevelAccess
{
    /**
     * @param list<int> $levels alle Level mit Prüfung, aufsteigend
     * @param list<int> $optionalLevels als freiwillig markierte Level
     * @return int|null Level, das bestanden sein muss (null = frei zugänglich)
     */
    public static function requiredLevel(array $levels, array $optionalLevels, int $target): ?int
    {
        $previous = array_filter($levels, static fn (int $level): bool => $level < $target);
        rsort($previous);
        foreach ($previous as $level) {
            if (!in_array($level, $optionalLevels, true)) {
                return $level;
            }
        }
        return null;
    }
}
