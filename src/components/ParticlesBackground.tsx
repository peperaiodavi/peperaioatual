// ParticlesBackground - Efeito de poeira flutuante ao fundo
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import './ParticlesBackground.css';

interface ParticlesBackgroundProps {
  particleColor?: string;
  particleOpacity?: number;
  particleSize?: number;
  particleCount?: number;
  speed?: number;
}

export default function ParticlesBackground({
  particleColor = "#60a5fa", // Azul harmônico com a página
  particleOpacity = 0.4,
  particleSize = 3,
  particleCount = 80,
  speed = 0.5,
}: ParticlesBackgroundProps) {
  const [init, setInit] = useState(false);

  // Inicializa o engine do particles
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles loaded", container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: {
            enable: false,
          },
          onHover: {
            enable: true,
            mode: "bubble",
          },
        },
        modes: {
          bubble: {
            distance: 150,
            size: particleSize * 2,
            duration: 2,
            opacity: particleOpacity * 1.5,
          },
        },
      },
      particles: {
        color: {
          value: particleColor,
        },
        links: {
          enable: false, // Sem linhas conectando
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: speed,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: particleCount,
        },
        opacity: {
          value: particleOpacity,
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.1,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: particleSize },
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 0.5,
          },
        },
        wobble: {
          enable: true,
          distance: 10,
          speed: 2,
        },
      },
      detectRetina: true,
    }),
    [particleColor, particleOpacity, particleSize, particleCount, speed]
  );

  if (!init) {
    return null;
  }

  return (
    <div className="particles-background-container">
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    </div>
  );
}
