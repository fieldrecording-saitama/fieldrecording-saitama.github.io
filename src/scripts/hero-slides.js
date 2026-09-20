async function initializeHeroSlides() {
  const container = document.querySelector(".hero-media");

  if (!container) {
    return;
  }

  try {
    const response = await fetch("/data/hero-slides.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config = await response.json();
    const slides = Array.isArray(config.slides)
      ? config.slides.filter((slide) => typeof slide.image === "string" && slide.image)
      : [];

    if (slides.length === 0) {
      throw new Error("スライド画像が登録されていません");
    }

    const intervalSeconds = Math.max(2, Number(config.intervalSeconds) || 8);
    const durationSeconds = intervalSeconds * slides.length;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && slides.length > 1) {
      const fadeSeconds = Math.min(1.2, intervalSeconds / 3);
      const fadeIn = (fadeSeconds / durationSeconds) * 100;
      const holdUntil = ((intervalSeconds - fadeSeconds) / durationSeconds) * 100;
      const fadeOut = (intervalSeconds / durationSeconds) * 100;
      const style = document.createElement("style");
      style.textContent = `
        @keyframes heroCarouselDynamic {
          0% { opacity: 0; }
          ${fadeIn}% { opacity: 1; }
          ${holdUntil}% { opacity: 1; }
          ${fadeOut}% { opacity: 0; }
          100% { opacity: 0; }
        }
      `;
      document.head.append(style);
    }

    const fragment = document.createDocumentFragment();

    slides.forEach((slide, index) => {
      const element = document.createElement("span");
      element.className = "hero-slide";
      element.style.backgroundImage = `url("${slide.image.replaceAll('"', '\\"')}")`;
      element.style.backgroundPosition =
        typeof slide.position === "string" && slide.position ? slide.position : "center";

      if (reduceMotion || slides.length === 1) {
        element.style.opacity = index === 0 ? "1" : "0";
      } else {
        element.style.animationName = "heroCarouselDynamic";
        element.style.animationDuration = `${durationSeconds}s`;
        element.style.animationDelay = `${index * intervalSeconds}s`;
      }

      fragment.append(element);
    });

    container.replaceChildren(fragment);
  } catch (error) {
    console.error("トップスライダーを読み込めませんでした:", error);
  }
}

initializeHeroSlides();
