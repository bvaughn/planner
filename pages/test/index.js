import Link from "next/link";

export default function Test() {
  return (
    <>
      <h1>App</h1>
      <ul>
        <li>
          <Link href="/">App</Link>
        </li>
      </ul>
      <h1>Pages</h1>
      <ul>
        {Object.entries(URLS).map(([name, query]) => (
          <li key={name}>
            <Link href={`/headless?${query}`}>{name}</Link>
          </li>
        ))}
      </ul>
      <h1>Images</h1>
      <ul>
        {Object.entries(URLS).map(([name, query]) => (
          <li key={name}>
            <Link href={`/api/ogimage/?${query}`}>{name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const URLS = {
  default: `(tasks~!(id~1~start~*2022-01-01~stop~*2022-03-15~name~Planner_JS~owner~planner)(start~*2022-01-15~stop~*2022-05-30~name~Plan_and_share_your_next_project_in_minutes~isOngoing~~owner~team)(start~*2022-02-01~stop~*2022-05-01~name~Lightweight_ightweight_planning_tool~dependency~1~owner~planner)~team~(planner~(name~Planner_JS~color~**H543e5b~avatar~*/static/avatar.png)team~(name~Your_team~color~**H22223B)))~`,
  days: `(tasks~!(start~*2022-02-12~stop~*2022-02-13~name~Spring_cleaning~owner~timeoff)(start~*2022-02-14~stop~*2022-02-17~name~Work~owner~pro)~team~(pro~(name~Professional_Brian)timeoff~(name~Time_off_Brian)))~)`,
  weeks: `(tasks~!(name~Week_A~start~*2022-01-03~stop~*2022-01-09~owner~Erin)(name~Week_B~start~*2022-01-10~stop~*2022-01-23~owner~Erin)(name~Week_C~start~*2022-01-17~stop~*2022-01-23~owner~Chris)~team~())~)`,
  months: `(tasks~!(id~example~name~Design_API~owner~bvaughn~start~*2022-01-01~stop~*2022-03-15)(id~0~name~Write_API_documentation~owner~susan~start~*2022-03-01~stop~*2022-05-01~dependency~example)(id~1~name~Support_product_team_integration~owner~bvaughn~start~*2022-03-15~stop~*2022-05-15~isOngoing~~dependency~example)(id~2~name~Finish_project_carryover~owner~susan~start~*2022-01-01~stop~*2022-03-01)(id~3~name~GitHub_issue_support~owner~team~start~*2022-03-01~stop~*2022-04-01~isOngoing)~team~(bvaughn~(avatar~_N~name~Brian)team~(avatar~_N~name~Unclaimed)))~)`,
  years: `(tasks~!(start~*2022-01-01~stop~*2022-06-30~name~H1_2022)(start~*2022-07-01~stop~*2022-12-31~name~H2_2022)(start~*2023-01-01~stop~*2023-06-30~name~H1_2023)(start~*2022-01-01~stop~*2022-12-31~name~*2022~owner~Other_team)~team~())~`,
};
