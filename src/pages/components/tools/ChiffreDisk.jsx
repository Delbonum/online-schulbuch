import React, { useState, useRef, useEffect } from 'react';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function ChiffreDisk({
  presetText = '',
  presetShift = 0,
  showHint = false,
  showDecryption = true,
  onHintToggle
}) {
  const [shift, setShift] = useState(presetShift);
  const [hintVisible, setHintVisible] = useState(false);
  const svgRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (onHintToggle) {
      onHintToggle(hintVisible);
    }
  }, [hintVisible, onHintToggle]);

  const getDecryption = (text) => {
    return text
      .toUpperCase()
      .split('')
      .map((char) => {
        const idx = alphabet.indexOf(char);
        if (idx === -1) return char;
        return alphabet[(idx - shift + 26) % 26];
      })
      .join('');
  };

  const startDrag = () => {
    dragging.current = true;
  };

  const stopDrag = () => {
    dragging.current = false;
  };

  const onMouseMove = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = cy - e.clientY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const newShift = Math.round((angle % 360) / (360 / 26));
    setShift((26 + newShift) % 26);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-[500px] h-[500px]">
        <svg
          viewBox="0 0 500 500"
          xmlns="http://www.w3.org/2000/svg"
          ref={svgRef}
          onMouseDown={startDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onMouseMove={onMouseMove}
        >
          <g transform="translate(250,250) scale(1,-1)">
            <circle cx="0" cy="0" r="220" fill="transparent" stroke="white" strokeWidth="2" />
            <circle cx="0" cy="0" r="180" fill="transparent" stroke="gray" strokeWidth="1" />
            {alphabet.split('').map((char, i) => (
              <text
                key={char}
                textAnchor="middle"
                transform={`rotate(${-i * 360 / 26}, 0, 0) translate(0, 195) scale(1,-1)`}
                style={{ userSelect: 'none', fill: 'white' }}
              >
                {char}
              </text>
            ))}
            {alphabet.split('').map((char, i) => (
              <text
                key={char + 'inner'}
                textAnchor="middle"
                transform={`rotate(${(shift * 360 / 26) - i * 360 / 26}, 0, 0) translate(0, 150) scale(1,-1)`}
                style={{ userSelect: 'none', fill: 'deepskyblue' }}
              >
                {char}
              </text>
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-4 w-full max-w-sm">
        <div className="mb-4 space-y-1 text-white">
            <div><span className="font-bold">Stellung:</span> A ↔ {alphabet[shift]}</div>
            <div><span className="font-bold">Verschiebezahl:</span> {shift}</div>
            <div><span className="font-bold">Schlüssel:</span> {alphabet[shift]}</div>
            </div>
            <input
                type="range"
                min="0"
                max="25"
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full"
                />

        {showHint && (
          <button
            onClick={() => setHintVisible(prev => !prev)}
            className="mt-4 px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-black transition"
          >
            {hintVisible ? 'Tipp ausblenden' : 'Tipp einblenden'}
          </button>
        )}

        {hintVisible && showHint && (
          <div className="mt-2 p-4 bg-white/10 text-white border border-white rounded-lg">
            <p><strong><b>TIPP:</b></strong> Stelle die Scheibe so ein, dass unter dem weißen "A" das blaue "D" zu sehen ist.<br />
              Dann ordne jedem Buchstaben aus dem verschlüsselten Geheimtext (blau) einen Klartextbuchstaben (weiß) zu.</p>
          </div>
        )}

        {showDecryption && presetText && (
          <div className="mt-4">
            <label className="block text-white font-bold">Entschlüsselung:</label>
            <p className="mt-2 bg-white text-black rounded p-2">
              {getDecryption(presetText)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
