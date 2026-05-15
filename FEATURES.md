# New Features

## Demonstrations

### feature Description

The idea is for a science teacher to demonstrate this to thier class. They will want to show how one or many elements, or molecules, could combine to create new molecules, and show the reaction type that would take place in doing so.

There would also be some annotations on the view, to explain what is happening.

### Approach

The initial approach is to have a bunch of pre-defined demonstrations that they can pick from, some examples:

- How 2 hydrogens and 1 Oxygen make water
- How 2 molecules combine to become a new molecule
- How we can add a couple of elements to a molecule, and it becomes a new molecule

We would show this is stages:

1. The ingredients, all of the elements/molecules being used for the demo. Then the user clicks the next step on the screen: Combine
2. The elements animate to come together as the molecule with descriptive text on what happened and what molecule was created. Then they click the next step button: Results
3. The results show text that explain what the reaction was, what energy was produced to combine it, and any other education info for students.

We would have two levels of education audiences in the descriptions presented: Elementary, and Advanced, and the descriptions reflect the level of the student watching the demo.

### UX

We start on a screen with a dialog, which allows them to select a pre-packaged demonstration, we can have up to 15 different chemical combinations and demos -- you can pick which ones are the most educational, from basic, to complicated.

Then once selected, we have a new demo player, that we epxlain what is happening step by step with bubble pop-ups over the 3d scene. The teacher, or student can click to go to the next step in the process, and we use animations to show how the molecules form, and even can animate with effects what happened in the reaction.

The last step is the result, with the explanation bubbles popping up to explain what happened and what chemical it created.

The teacher can share the link with it already selected. the share links can just be /demo/[demoid_slug] .. where they start on /demo to make a selection.

### Future Enhancements

teachers can builkd thier own step by step interactions for demonstration to thier students, making it shareable, but thats a future enhancement

** DONE **

## Periodic table of Elements Explorer

### Description

An interactive periodic Table of elements that allows users to click on one of the elements form the table, as it is traditionally shown to students. When they click the element, we get a 3d representation of the model using our current 3d rendering engine, with the electrons swirling around.

The idea is an educational tour of the periodic table of elements. Along with the rendering of the atom, we also supply atomic data on the element, as well as some information about where we use the element, how it's formed, and other info for students.

### Routing

The url path should be /elements for the initial landing page with just the periodic table. Then when one is clicked, the url path is /elements/[element_name_slug]

But clicking an element doesnt refresh the page, it just changes the location, we want the transition from clikcing the element form the table to the detail to be anmated and smooth in the scene.

### UX

On the homepage, I wanta full section dedicated to this feature, with images of the periodic table shown, as well as some example 3d renderings of the more complex elements, which might make for a more striking 3d visualization.

On the periodic table page, we will present an interactive Periodic table of Elements, which as the user hovers over one, the card slightly increases in size to indicate you can click it. When the user clicks the element item, it zooms in and we show the traditional Element card, but within it, a 3d rendering of the element -- using the same 3d visualization tools we already have build for this for our molecules.

The element 3d viz should also show protons and any other sub-atomic elements animated and flying around, or in the core atom.

We might wnat tio consider now making the core atom circle a litte more fuzzy at the edges, instead of a hard circle (globally). But for this page only, we will render the other sub-atomic particles, and having the circle atom shape be a little more transparent, we can see other sub atmic particles inside it swirling around based on the atom's atomic numbers.

When an element is selected, below it, a card with all the information about the element in shown for educational purposes. If we have molecules in our database that uses this element, we should have a section that says, "See Related Molecules", where all of the molecules are listed that contain this element, clicking on goes right to the /app page with the molecule loaded.



