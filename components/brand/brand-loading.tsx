import BrandLogo from './brand-logo';
export default function BrandLoading() {
  return (
    <div className="brand-route-loading" role="status">
      <div className="brand">
        <BrandLogo />
      </div>
      <div className="brand-paw-track">
        <span />
        <span />
        <span />
      </div>
      <p>Preparando un buen comienzo…</p>
    </div>
  );
}
