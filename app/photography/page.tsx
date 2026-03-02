import Image from "next/image";
import { photos } from "@/lib/photos";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = { title: "Photography — Derek Leonhardt" };

const gallery = (
  <div className="photo-gallery">
    {photos.map((photo) => (
      <figure key={photo.src} className="photo-card">
        <div className="photo-card__media">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
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
