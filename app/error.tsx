'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: '10vh 8vw', fontFamily: 'sans-serif' }}>
      <h1>Esta página necesita otro intento.</h1>
      <p>Tus datos guardados siguen en su lugar.</p>
      <button onClick={reset}>Volver a intentar</button>
    </main>
  );
}
