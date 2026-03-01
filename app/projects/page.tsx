import { projects } from "@/lib/projects";
import HomeSidebar from "@/components/HomeSidebar";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";
import Tag from "@/components/Tag";

export const metadata = { title: "Projects — Derek Leonhardt" };

export default function ProjectsPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} maxWidth="var(--content-width)">
      <PageHeader title="Projects" description="Tinkering" />

      {projects.map((project) => (
        <a
          key={project.title}
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="row-fade project-entry"
        >
          <div className="split-baseline">
            <span className="project-entry__title">{project.title}</span>
            <span className="text-muted project-entry__year">
              {project.year}
            </span>
          </div>
          <p className="text-muted project-entry__desc">
            {project.description}
          </p>
          <div className="project-entry__tags">
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </a>
      ))}
    </PageLayout>
  );
}
