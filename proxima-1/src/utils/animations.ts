export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8, ease: "easeOut" }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

// Elegant blur-to-focus reveal
export const blurToFocus = {
  initial: { 
    opacity: 0, 
    filter: "blur(10px)",
    y: 20 
  },
  animate: { 
    opacity: 1, 
    filter: "blur(0px)",
    y: 0 
  },
  transition: { 
    duration: 0.8, 
    ease: [0.22, 1, 0.36, 1] 
  }
};

// Smooth breathing animation
export const breathe = {
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Progressive reveal with line animation
export const drawLine = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 1.5, ease: "easeInOut" }
};

// Hover animations
export const hoverScale = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 }
};

export const hoverGlow = {
  whileHover: { 
    boxShadow: "0 0 30px rgba(139, 92, 246, 0.3)",
    borderColor: "rgba(139, 92, 246, 0.5)"
  },
  transition: { duration: 0.3 }
};

// Magnetic hover effect
export const magneticHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

// Parallax configs
export const parallaxY = (offset: number = 50) => ({
  initial: { y: -offset },
  animate: { y: offset },
  transition: { duration: 0.5 }
});

// Card tilt effect
export const tiltCard = {
  whileHover: {
    rotateX: -5,
    rotateY: 5,
    scale: 1.02,
    transition: { duration: 0.3 }
  }
}; 