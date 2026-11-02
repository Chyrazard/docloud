import Toby from './toby';
export default function BrandLogo({ faceOnly = false }: { faceOnly?: boolean }) {
  return (
    <>
      <span className="brand-mark brand-toby-mark">
        <Toby face />
      </span>
      {!faceOnly && (
        <span className="brand-wordmark">
          do<span className="brand-light">cloud</span>
          <i />
        </span>
      )}
    </>
  );
}
