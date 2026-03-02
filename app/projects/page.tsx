import { projects } from "@/lib/projects";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Projects — Derek Leonhardt",
  description: "Tinkering",
};

export default function ProjectsPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} maxWidth="var(--content-width)">
      <div className="page-header">
        <h1>Projects</h1>
        <p>Tinkering</p>
      </div>

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
              <span key={tag} className="text-muted tag">{tag}</span>
            ))}
          </div>
        </a>
      ))}
    </PageLayout>
  );
}
