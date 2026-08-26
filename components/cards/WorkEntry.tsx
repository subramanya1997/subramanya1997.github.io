// Port of _includes/components/work-entry.html.
import type { AboutEducation, AboutExperience } from "@/components/lib/site-data";

type Props =
  | { entryType: "experience"; entry: AboutExperience }
  | { entryType: "education"; entry: AboutEducation };

export default function WorkEntry(props: Props) {
  const orgName =
    props.entryType === "experience" ? props.entry.company : props.entry.institution;
  const role = props.entryType === "experience" ? props.entry.position : props.entry.degree;
  const { logo, period, description } = props.entry;

  return (
    <div className="work-entry">
      <div className="company-logo">
        {logo ? (
          <img src={logo} alt={`${orgName} logo`} width={40} height={40} loading="lazy" decoding="async" />
        ) : (
          <div className="logo-placeholder">{orgName.slice(0, 1)}</div>
        )}
      </div>

      <div className="work-details">
        <div className="company-name">{orgName}</div>
        <div className="position">{role}</div>
        <div className="period">{period}</div>
        <div className="work-description">
          <p>{description}</p>
          <ul>
            {props.entryType === "experience"
              ? (props.entry.achievements ?? []).map((achievement) => (
                  <li key={achievement}>{achievement}</li>
                ))
              : (props.entry.details ?? []).flatMap((detail) =>
                  Object.entries(detail).map(([key, value]) => (
                    <li key={key}>
                      <strong>{`${key}:`}</strong>
                      {` ${value}`}
                    </li>
                  ))
                )}
          </ul>
        </div>
      </div>
    </div>
  );
}
