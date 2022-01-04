# Planner

Lightweight, interactive planning tool that visualizes a series of tasks using an HTML canvas.

![Planner JS meta-image](https://user-images.githubusercontent.com/29597/148128667-3e2cd87a-3a7a-4123-bdbc-168965baa4e6.png)

Try it yourself at [plannerjs.dev](https://plannerjs.dev)

Plans created with Planner are automatically saved to the URL and can be easily shared with others.

If you like this project ☕️ buy me a cup of coffee at [patreon.com/bvaughn](https://www.patreon.com/bvaughn) 😃

---

## Examples

### [View years example](https://plannerjs.dev/?(tasks~!(start~*2022-01-01~stop~*2022-06-30~name~H1_2022)(start~*2022-07-01~stop~*2022-12-31~name~H2_2022)(start~*2023-01-01~stop~*2023-06-30~name~H1_2023)(start~*2022-01-01~stop~*2022-12-31~name~*2022~owner~Other_team)~team~())~)

<img width="1004" alt="Planner screenshot" src="https://user-images.githubusercontent.com/29597/148121007-ffa0c1c7-48b5-452d-8d5a-b8e722b45163.png">

### [View months example](https://plannerjs.dev/?(tasks~!(id~example~name~Design_API~owner~bvaughn~start~*2022-01-01~stop~*2022-03-15)(id~0~name~Write_API_documentation~owner~susan~start~*2022-03-01~stop~*2022-05-01~dependency~example)(id~1~name~Support_product_team_integration~owner~bvaughn~start~*2022-03-15~stop~*2022-05-15~isOngoing~~dependency~example)(id~2~name~Finish_project_carryover~owner~susan~start~*2022-01-01~stop~*2022-03-01)(id~3~name~GitHub_issue_support~owner~team~start~*2022-03-01~stop~*2022-04-01~isOngoing)~team~(bvaughn~(avatar~https://avatars.githubusercontent.com/u/29597~name~Brian)team~(avatar~_N~name~Unclaimed)))~)

<img width="1004" alt="Planner screenshot" src="https://user-images.githubusercontent.com/29597/148121010-6b1c5e1d-d6ab-4159-89ca-61a050c40823.png">

### [View weeks example](https://plannerjs.dev/?(tasks~!(name~Week_A~start~*2022-01-03~stop~*2022-01-09~owner~Erin)(name~Week_B~start~*2022-01-10~stop~*2022-01-23~owner~Erin)(name~Week_C~start~*2022-01-17~stop~*2022-01-23~owner~Chris)~team~())~)

<img width="1004" alt="Planner screenshot" src="https://user-images.githubusercontent.com/29597/148121011-90ed264b-e8be-4455-a6aa-9041dec8db58.png">

### [View days example](http://localhost:3000/?(tasks~!(start~*2022-02-12~stop~*2022-02-13~name~Spring_cleaning~owner~timeoff)(start~*2022-02-14~stop~*2022-02-17~name~Work~owner~pro)~team~(pro~(name~Professional_Brian)timeoff~(name~Time_off_Brian)))~)

<img width="1004" alt="Planner screenshot" src="https://user-images.githubusercontent.com/29597/148121012-8529e903-1476-46b6-80ab-3996d3b88288.png">
