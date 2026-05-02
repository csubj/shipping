# Shipping 

Shipping is a frontend-ui/app to be hosted on github pages. It hosts a few different views of NP-Characters and PC-character relationships that can be viewed as a table or as a graph to visualize and manage the social network and current status of relationships in a D&D tabletop game. 

# Features
- Import and export current graph/data so that there isnt any active state to persist 
- Add and remove characters 
- Add and remove PC-characters 
- A graph view in a tab that represents the network of pc/npc relationships. 
    - hovering on a vertex shows information about that player and all of that person's relationships (the links)
    - hovering on a link gives a context menu that you can change the value of that connection
    - There are options to add new links between vertices.
- A table view in a tab that displays the relationships with an option to edit that row.
- A button that can be clicked to degrade ALL relationships by a configurable amount to signal that time has passed. 
- A secondary mapping or graph of characters that have affinity or anti-affinity.
    - if a PC character befriends/opposes one or both of these characters there is a configurable change to the PC characters with one or both of those NPC relationships. 
    - These status changes should be viewable in the hover-over in the graph view and table view. 

# Data Model information: 
- PC characters have a first/last name and a class, and a section for notes 
- NPC characters have a first/last name, a location, and a section for notes 
- Relationships

# UI elements
- https://www.radix-ui.com/ for styling 


# Technical details 
- typescript/react based
- tailwind css for styling
- docker + docker compose to test locally 
- pnpm build tool 
- cicd auto-deploy to github pages 
- Generate a small example set of data to be loaded by default for testing. 