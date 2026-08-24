// Port of work.md (layout: page, custom_layout: true).
import WorkEntry from "@/components/cards/WorkEntry";
import { pageMeta } from "@/components/lib/page-meta";
import { getAbout } from "@/components/lib/site-data";
import PageLayout from "@/components/site/PageLayout";

const meta = pageMeta({
  title: "Work",
  url: "/work/",
  customLayout: true,
  stylesheets: [
    "/assets/css/components/work-entry.css",
    "/assets/css/pages/work.css",
  ],
});

export default function Work() {
  const about = getAbout();

  return (
    <PageLayout meta={meta}>
      <header className="index-header work-header">
        <h1>{meta.title}</h1>
      </header>

      <div className="work-container">
        <div className="experience">
          {about.experience.map((job) => (
            <WorkEntry key={`${job.company}-${job.period}`} entry={job} entryType="experience" />
          ))}

          {about.education.map((edu) => (
            <WorkEntry
              key={`${edu.institution}-${edu.period}`}
              entry={edu}
              entryType="education"
            />
          ))}
        </div>
      </div>

      <div className="resume-container">
        <a
          href={about.cv_file}
          className="resume-button"
          target="_blank"
          title="Get My Résumé"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Get My Résumé
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    </PageLayout>
  );
}
