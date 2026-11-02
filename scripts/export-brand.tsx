/** Reproducible vector assets, authored in this repository. No external design API is used. */
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import Toby from '../components/brand/toby';
import sharp from 'sharp';
async function main() {
  const css = await readFile('app/brand.css', 'utf8');
  const characterCss = css.slice(css.indexOf('.toby-art'), css.indexOf('.brand .brand-mark'));
  const motionCss = css.slice(
    css.indexOf('@keyframes toby-breathe'),
    css.search(/@media\s*\(max-width:\s*1000px\)/),
  );
  const style = `<style>${characterCss}${motionCss}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>`;
  const full = renderToStaticMarkup(<Toby title="Toby, el Jack Russell de DOCLOUD" />);
  const face = renderToStaticMarkup(<Toby face title="La carita de Toby, DOCLOUD" />);
  const styled = (svg: string) => svg.replace(/(<svg[^>]*>)/, `$1${style}`);
  await mkdir('public/brand', { recursive: true });
  await writeFile('public/brand/toby.svg', styled(full));
  await writeFile('public/brand/toby-face.svg', styled(face));
  for (const action of ['greet', 'scratch', 'lick'] as const) {
    await writeFile(
      `public/brand/toby-${action}.svg`,
      styled(renderToStaticMarkup(<Toby action={action} title={`Toby · ${action}`} />)),
    );
  }
  const nestedFace = face.replace('<svg', '<svg x="8" y="9" width="224" height="218"');
  await writeFile(
    'public/icon.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="66" fill="#214d3f"/>${nestedFace}<style>.toby-scratch-leg,.toby-fleas,.toby-sleep-eyes,.toby-tongue{display:none}</style></svg>`,
  );
  const logoFace = face.replace(
    '<svg',
    '<svg style="width:140px;height:139px" x="0" y="4" width="140" height="139"',
  );
  await writeFile(
    'public/brand/docloud-logo.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150" role="img" aria-label="DOCLOUD"><rect x="8" y="13" width="120" height="120" rx="39" fill="#edf2e5"/>${logoFace}<text x="143" y="102" font-family="Manrope,Arial,sans-serif" font-size="76" font-weight="700" letter-spacing="-5" fill="#253b33">do<tspan font-weight="400">cloud</tspan><tspan fill="#96af76">.</tspan></text>${style}</svg>`,
  );
  const faceIcon = await readFile('public/icon.svg');
  await sharp(faceIcon).resize(1024, 1024).png().toFile('public/brand/toby-avatar.png');
  await sharp(Buffer.from(styled(full)))
    .resize({ width: 1200 })
    .png()
    .toFile('public/brand/toby-full.png');
  const socialDog = full.replace(
    '<svg',
    '<svg style="width:490px;height:540px" x="675" y="50" width="490" height="540"',
  );
  const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f0f5e7"/><circle cx="920" cy="308" r="238" fill="#e6eed8"/><circle cx="920" cy="308" r="263" fill="none" stroke="#dce6cd" stroke-width="2"/><text x="76" y="112" fill="#254b36" font-family="Arial,sans-serif" font-size="48" font-weight="700" letter-spacing="-2">docloud<tspan fill="#92ab70">.</tspan></text><text x="76" y="275" fill="#254b36" font-family="Arial,sans-serif" font-size="56" font-weight="700" letter-spacing="-2">Buenos encuentros.</text><text x="76" y="343" fill="#254b36" font-family="Arial,sans-serif" font-size="56" font-weight="700" letter-spacing="-2">Mejores historias.</text><text x="79" y="405" fill="#859873" font-family="Arial,sans-serif" font-size="25">Un buen comienzo para tu peludo.</text><rect x="77" y="458" width="249" height="56" rx="14" fill="#284e38"/><text x="108" y="494" fill="#f1f6e8" font-family="Arial,sans-serif" font-size="21">Conoce DOCLOUD</text>${socialDog}${style}</svg>`;
  await sharp(Buffer.from(social)).png().toFile('public/brand/docloud-social.png');
  console.log(
    'Exported standing Toby, animated gestures, signature, favicon, PNG avatars and social card.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
