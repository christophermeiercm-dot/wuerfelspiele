/** Würfel mit echten Augen (CSS), statt Unicode-Zeichen – sieht auf jedem Gerät gleich aus. */
const AUGEN: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

export function Wuerfel({ n, klein = false, gold = false }: { n: number; klein?: boolean; gold?: boolean }) {
  return (
    <span className={'die' + (klein ? ' klein' : '') + (gold ? ' gold' : '')} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={AUGEN[n]?.includes(i) ? 'pip' : ''} />
      ))}
    </span>
  );
}

export const SPIELERFARBEN = ['#E7B33D', '#3B82C4', '#2FA37A', '#D9644A', '#8B6BC9', '#E08BB0'];
