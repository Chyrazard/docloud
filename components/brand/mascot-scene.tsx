import { Heart, Sparkles } from 'lucide-react';
import Toby from './toby';
export default function MascotScene() {
  return (
    <div className="join-story-photo join-toby-scene">
      <span className="scene-kicker">
        <Sparkles size={12} /> CONOCE A TOBY
      </span>
      <div className="scene-orbit scene-orbit-one" />
      <div className="scene-orbit scene-orbit-two" />
      <span className="scene-spark scene-spark-one">✦</span>
      <span className="scene-spark scene-spark-two">✧</span>
      <Toby className="scene-toby" title="Toby, el Jack Russell de DOCLOUD" />
      <div className="scene-caption">
        <span>
          <Heart size={17} />
        </span>
        <div>
          Una pata en cada paso.<small>Toby, tu compañero en DOCLOUD.</small>
        </div>
      </div>
    </div>
  );
}
