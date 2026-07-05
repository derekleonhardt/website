import Image from "next/image";
import { photos } from "@/lib/photos";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Photography — Derek Leonhardt",
  description: "Fujifilm X100V - Sony A6000 - Canon AE-1",
};

const gallery = (
  <div className="photo-gallery">
    {photos.map((photo, i) => (
      <figure key={photo.src} className="photo-card">
        <div className="photo-card__media">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            priority={i === 0}
            quality={90}
            sizes="(max-width: 640px) 100vw, 384px"
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
        <p>Fujifilm X100V - Sony A6000 - Canon AE-1</p>
      </header>
    </PageLayout>
  );
}
