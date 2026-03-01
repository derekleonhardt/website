import Image from "next/image";
import { photos } from "@/lib/photos";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = { title: "Photography — Derek Leonhardt" };

const gallery = (
  <div className="photo-gallery">
    {photos.map((photo, index) => (
      <figure
        key={photo.src}
        className="photo-card"
        style={{
          animation: "fadeUp 0.5s ease both",
          animationDelay: `${index * 0.05}s`,
        }}
      >
        <div className="photo-card__media">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            unoptimized
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <figcaption className="text-muted photo-caption">
          {photo.caption}
        </figcaption>
      </figure>
    ))}
  </div>
);

export default function PhotographyPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} fullWidth={gallery}>
      <header className="page-header">
        <h1>Photography</h1>
        <p>Fujifilm X100V - Sony A6000 - Cannon AE1</p>
      </header>
    </PageLayout>
  );
}
