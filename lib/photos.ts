export interface Photo {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export const photos: Photo[] = [
  {
    src: "/photos/three-peaks.jpg",
    alt: "The third peak",
    caption: "Mt. Olomana, Oahu",
    width: 6240,
    height: 4160,
  },
  {
    src: "/photos/charlift.jpg",
    alt: "Chairlift",
    caption: "Breckenridge, Colorado",
    width: 3089,
    height: 2048,
  },
  {
    src: "/photos/lighthouse.jpg",
    alt: "Lighthouse",
    caption: "Makapuu Point, Oahu",
    width: 4000,
    height: 6000,
  },
  {
    src: "/photos/lone-boat.jpg",
    alt: "A lone boat on the water",
    caption: "Oahu",
    width: 6240,
    height: 4160,
  },
  {
    src: "/photos/marlinszn.jpg",
    alt: "Marlin",
    caption: "Pacific Ocean, Oahu",
    width: 6000,
    height: 3376,
  },
  {
    src: "/photos/moon.jpg",
    alt: "The moon",
    caption: "Pompano Beach, Florida",
    width: 2048,
    height: 1364,
  },
  {
    src: "/photos/old-rag.jpg",
    alt: "Old Rag",
    caption: "Shenandoah, Virginia",
    width: 6240,
    height: 4160,
  },
  {
    src: "/photos/palm.jpg",
    alt: "Palm tree",
    caption: "Pompano Beach, Florida",
    width: 2048,
    height: 1364,
  },
  {
    src: "/photos/pompano.jpg",
    alt: "Pompano Beach",
    caption: "Pompano Beach, Florida",
    width: 2048,
    height: 1364,
  },
  {
    src: "/photos/steeple.jpg",
    alt: "Church steeple",
    caption: "Charleston, South Carolina",
    width: 1960,
    height: 2941,
  },
  {
    src: "/photos/beached.jpg",
    alt: "Beached boat in costa rica",
    caption: "Esterillos Oeste, Costa Rica",
    width: 6240,
    height: 4160,
  },
];
