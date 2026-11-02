'use client';
import { useId } from 'react';
export type TobyAction = 'idle' | 'greet' | 'scratch' | 'lick' | 'happy' | 'sleep';
/** Original standing Jack Russell, drawn for DOCLOUD. Anatomical groups are the animation rig. */
export default function Toby({
  face = false,
  action = 'idle',
  className = '',
  title,
}: {
  face?: boolean;
  action?: TobyAction;
  className?: string;
  title?: string;
}) {
  const key = 'toby' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const paint = (name: string) => `url(#${key}-${name})`;
  const ink = '#3f4135';
  return (
    <svg
      className={`toby-art toby-is-${action} ${face ? 'toby-face' : ''} ${className}`}
      viewBox={face ? '26 27 163 149' : '15 15 330 330'}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`${key}-coat`}
          x1="147"
          y1="161"
          x2="210"
          y2="289"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fffefb" />
          <stop offset=".66" stopColor="#fffef9" />
          <stop offset="1" stopColor="#e7e6d9" />
        </linearGradient>
        <linearGradient
          id={`${key}-face`}
          x1="101"
          y1="52"
          x2="131"
          y2="144"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fffefb" />
          <stop offset=".75" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#ecebdd" />
        </linearGradient>
        <linearGradient
          id={`${key}-tan`}
          x1="94"
          y1="41"
          x2="139"
          y2="132"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d69946" />
          <stop offset=".58" stopColor="#c08232" />
          <stop offset="1" stopColor="#a86c2b" />
        </linearGradient>
        <linearGradient
          id={`${key}-ear`}
          x1="47"
          y1="39"
          x2="77"
          y2="107"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d29240" />
          <stop offset="1" stopColor="#b2762d" />
        </linearGradient>
        <linearGradient
          id={`${key}-nose`}
          x1="91"
          y1="104"
          x2="100"
          y2="125"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#655640" />
          <stop offset=".48" stopColor="#423b30" />
          <stop offset="1" stopColor="#2a2d25" />
        </linearGradient>
        <linearGradient
          id={`${key}-collar`}
          x1="96"
          y1="139"
          x2="138"
          y2="147"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#61805a" />
          <stop offset="1" stopColor="#28553d" />
        </linearGradient>
        <linearGradient
          id={`${key}-tag`}
          x1="111"
          y1="151"
          x2="125"
          y2="169"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#edce8c" />
          <stop offset="1" stopColor="#c8a567" />
        </linearGradient>
        <linearGradient
          id={`${key}-tongue`}
          x1="114"
          y1="134"
          x2="125"
          y2="149"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d77f7a" />
          <stop offset="1" stopColor="#eea49a" />
        </linearGradient>
        <radialGradient id={`${key}-eye`} cx=".3" cy=".2" r=".85">
          <stop stopColor="#725232" />
          <stop offset=".45" stopColor="#302f24" />
          <stop offset="1" stopColor="#171f18" />
        </radialGradient>
        <radialGradient id={`${key}-shadow`}>
          <stop stopColor="#53664b" stopOpacity=".22" />
          <stop offset="1" stopColor="#53664b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {!face && (
        <>
          <ellipse
            className="toby-ground"
            cx="196"
            cy="335"
            rx="139"
            ry="11"
            fill={paint('shadow')}
          />
          <g className="toby-tail">
            <path
              d="M294 187c20-13 33-26 33-47 0-17-7-32-14-43 19 10 29 29 27 48-1 24-17 43-36 57"
              fill={paint('coat')}
              stroke={ink}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M307 175c10-6 20-17 23-31 3 1 6 1 10 0-1 24-17 43-36 57l-10-14z"
              fill={paint('tan')}
            />
            <path
              d="M294 187c20-13 33-26 33-47 0-17-7-32-14-43 19 10 29 29 27 48-1 24-17 43-36 57"
              stroke={ink}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g className="toby-body">
            <g className="toby-far-hind">
              <path
                d="M241 221c-5 21-1 35 9 51 7 12 9 23 6 38-2 5-17 9-19 16 4 6 27 8 34 2 2-3-3-8-4-12l7-39 1-45"
                fill="#e7e6d8"
                stroke={ink}
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m245 325 2-6m7 8 2-6"
                stroke="#858877"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
            <g className="toby-front-paw-left">
              <path
                d="M109 216c2 25 3 54 0 81-1 10-5 17-14 21-5 3-8 6-8 10 8 7 31 7 37 0 0-6-5-9-4-15l15-85"
                fill="#eeede2"
                stroke={ink}
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m96 326 3-6m5 8 3-7"
                stroke="#858877"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
            <path
              d="M107 121c8 14 14 28 35 39 20 12 53 2 83 5 32 0 62 5 77 27 13 20 10 40-3 53-16 17-40 19-65 9-22-9-44-2-65 5-22 8-48-1-58-24-11-25-7-49-8-72-1-18-5-30-6-39z"
              fill={paint('coat')}
              stroke={ink}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M151 166c15 5 37 0 54 0 10 9 12 28 3 41-7 10-16 11-26 4-13-9-18-27-31-45z"
              fill={paint('tan')}
            />
            <path
              d="M115 230c17 19 35 22 56 17 36-10 49-13 72-7 22 5 36 4 55-6-12 20-35 28-64 18-23-8-42-2-66 5-24 7-45-2-53-27z"
              fill="#d7d8cb"
              opacity=".75"
            />
            <path
              d="M108 146c7 14 16 23 30 28"
              stroke="#faf9f0"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <g className="toby-seated-hind">
              <path
                d="M274 218c-9 15-6 34 8 51 12 15 16 30 12 45-1 7-13 10-14 17 4 7 34 9 42 1 2-5-4-9-5-16l-1-39c-2-23-8-44-15-57"
                fill={paint('coat')}
                stroke={ink}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M297 324c-3 3-4 7-3 10m10-10c-1 4 0 8 1 10m9-8 1 7"
                stroke="#858877"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
            <g className="toby-front-paw-right">
              <path
                d="M144 222c6 25 6 55 3 81-1 10-3 17-9 22-4 4-4 7-1 10 8 5 29 5 37-1 2-5-1-9-3-13-2-7 1-44 5-68 1-9 0-18-3-24"
                fill={paint('coat')}
                stroke={ink}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M143 327c-2 3-2 6-1 9m10-8v10m10-11 1 10"
                stroke="#858877"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M160 248c0 20-2 42-2 60"
                stroke="#fffef9"
                strokeWidth="5"
                strokeLinecap="round"
                opacity=".7"
              />
            </g>
            <g className="toby-scratch-leg">
              <path
                d="M277 231c-19 1-29-10-35-26-6-16-29-18-48-31l-20-20"
                stroke={ink}
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M277 231c-19 1-29-10-35-26-6-16-29-18-48-31l-20-20"
                stroke="#f6f4e9"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <ellipse
                cx="172"
                cy="151"
                rx="11"
                ry="15"
                transform="rotate(-32 172 151)"
                fill="#fcf9ee"
                stroke={ink}
                strokeWidth="2"
              />
              <path
                d="m163 145 5 3m-7 3 5 3"
                stroke="#858877"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          </g>
        </>
      )}
      <g className="toby-head">
        <g className="toby-ear-right">
          <path
            d="M140 52c4-8 8-13 13-13 7 1 22 14 31 23 3 4-1 14-5 20-7 13-15 22-24 27-6-11-11-25-15-57z"
            fill={paint('ear')}
            stroke={ink}
            strokeWidth="2.7"
            strokeLinejoin="round"
          />
          <path d="m146 59 8-12c9 11 15 24 18 37-8-9-17-18-26-25z" fill="#a66a2a" />
          <path
            d="M151 49c9 9 16 20 20 33"
            stroke="#e4b068"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="toby-ear-left">
          <path
            d="M94 52C84 40 75 33 68 36 56 41 41 47 35 54c-5 6 2 30 13 51 2 5 7 5 12-1 9-9 18-22 34-52z"
            fill={paint('ear')}
            stroke={ink}
            strokeWidth="2.7"
            strokeLinejoin="round"
          />
          <path d="M68 44c-8 16-14 34-16 52 12-10 22-24 31-41z" fill="#a76c2c" />
          <path d="M46 61c0 9 3 20 6 26" stroke="#e5b26e" strokeWidth="2" strokeLinecap="round" />
        </g>
        <path
          d="M77 68c4-17 20-27 38-26 25 0 42 15 46 37 5 26-9 48-32 61-17 9-38 3-51-11-16-17-13-43-1-61z"
          fill={paint('face')}
          stroke={ink}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M77 68c5-14 15-23 29-25 7 4 9 10 6 20-5 12-12 23-15 36-4 12-11 19-21 20-11-14-10-34 1-51z"
          fill={paint('tan')}
        />
        <path
          d="M134 46c14 8 22 18 26 33 4 20-4 39-21 53-13-1-23-11-21-25 2-15 8-21 10-35 2-9 1-19 6-26z"
          fill={paint('tan')}
        />
        <path
          d="M109 44c2-3 6-4 8-8 0 5 3 7 7 9"
          fill="#fffdf7"
          stroke="#e5e5d8"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d="M108 47c4 15 3 30-1 43" stroke="#fffef9" strokeWidth="6" strokeLinecap="round" />
        <path d="M78 73c5-5 12-7 18-3" stroke="#72502d" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M127 70c8-6 16-3 20 2" stroke="#72502d" strokeWidth="2.6" strokeLinecap="round" />
        <g className="toby-eyes">
          <g className="toby-eye toby-eye-left">
            <path d="M77 93c-2-12 1-20 9-20 8 0 13 10 10 21" fill="#925d2a" opacity=".55" />
            <g className="toby-pupil-look">
              <ellipse cx="87" cy="86" rx="8.2" ry="10.2" fill={paint('eye')} />
              <ellipse cx="84" cy="82" rx="3.1" ry="3.5" fill="#fffef8" />
              <circle cx="91" cy="91" r="1.3" fill="#f4ebd7" />
            </g>
          </g>
          <g className="toby-eye toby-eye-right">
            <path d="M124 94c-2-13 1-21 10-21 9 0 13 10 12 21" fill="#925d2a" opacity=".5" />
            <g className="toby-pupil-look">
              <ellipse cx="135" cy="86" rx="9" ry="10.6" fill={paint('eye')} />
              <ellipse cx="132" cy="82" rx="3.3" ry="3.5" fill="#fffef8" />
              <circle cx="139" cy="91" r="1.4" fill="#f4ebd7" />
            </g>
          </g>
        </g>
        <g className="toby-sleep-eyes">
          <path
            d="M79 89q8 7 17-1m30 0q9 7 19-1"
            stroke={ink}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M80 103c10-7 23-7 34-1 7 4 15 4 20 10 10 11 3 23-12 28-19 6-38-1-47-12-7-8-6-18 5-25z"
          fill="#fffdf6"
        />
        <path d="M78 122c11 15 27 21 45 15-15 12-39 6-48-7-2-3-3-7-2-10z" fill="#dfdfd1" />
        <path
          className="toby-smile"
          d="M92 123c12 12 32 14 46-5-2 14-13 24-26 22-10-1-17-8-20-17z"
          fill="#4f4637"
        />
        <g className="toby-tongue">
          <path d="M111 134c5-5 13-3 16 2 6 7 0 14-6 14-7-1-11-8-10-16z" fill={paint('tongue')} />
          <path d="m118 136 2 7" stroke="#c16e70" strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <path
          d="M95 124c13 10 28 6 39-5"
          stroke="#fffdf6"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <path d="M138 116c2-3 4-5 4-8" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <path
          d="M80 106c8-5 21-5 31 1 4 3 1 8-2 11-4 6-10 9-15 7-7-2-13-7-15-12-1-2-1-5 1-7z"
          fill={paint('nose')}
          stroke="#34352b"
          strokeWidth="1.8"
        />
        <ellipse cx="89" cy="108" rx="5.2" ry="2.2" fill="#d7d7c9" opacity=".85" />
        <ellipse cx="108" cy="111" rx="2.1" ry="1.5" fill="#212920" />
        <path d="M95 124c-2 3-5 5-9 5" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <g fill="#a1a58e" opacity=".7">
          <circle cx="74" cy="115" r=".9" />
          <circle cx="78" cy="120" r="1" />
          <circle cx="113" cy="118" r=".8" />
          <circle cx="119" cy="114" r=".9" />
          <circle cx="122" cy="120" r=".8" />
        </g>
        <path
          d="M95 136c13 8 28 7 41-3l4 7c-13 13-28 14-41 5z"
          fill={paint('collar')}
          stroke="#35543a"
          strokeWidth="1.1"
        />
        <path
          d="M102 141c10 5 21 3 31-3"
          stroke="#a5b998"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity=".8"
        />
        <g className="toby-tag">
          <circle cx="117" cy="149" r="3" stroke="#bd9c61" strokeWidth="1.8" />
          <circle cx="118" cy="160" r="9" fill={paint('tag')} stroke="#b89557" strokeWidth="1" />
          <path
            d="M113 161c-2 0-3-2-2-3 1-2 2-2 4-1 0-3 5-4 6-1 3-1 5 1 5 3 0 2-2 3-4 3h-9z"
            fill="#fbeac1"
          />
        </g>
      </g>
      {!face && (
        <g className="toby-fleas" stroke="#766144" strokeWidth="1.2" strokeLinecap="round">
          <g className="toby-flea toby-flea-one">
            <ellipse cx="162" cy="138" rx="1.4" ry="2" fill="#766144" />
            <path d="m159 136 2 1m2 1 2 1m-5 2 2-1" />
          </g>
          <g className="toby-flea toby-flea-two">
            <ellipse cx="178" cy="145" rx="1.3" ry="1.8" fill="#766144" />
            <path d="m175 144 2 1m2 1 2 1" />
          </g>
          <path
            className="toby-scratch-spark"
            d="m180 153 5-2m-3 8h6m-10 6 5 2"
            stroke="#a4b18b"
            strokeWidth="1.8"
          />
        </g>
      )}
    </svg>
  );
}
