# Discussion

## API Design

I struggled a lot when figuring out how to structure the project files.
For example:
- combining controllers and routes in files
- combining multiple controllers within the same file
- seperating the routes and controllers in different directories would have forced me to manage a duplicate file tree so that didn't work
- keeping track of progress on project with any of these structures
The design approach that worked best was defining my file hierarchy like the API routes I would be using.
This resulted in a lot of partially empty files but given the documentation, it made sense as the code would be easily referencable given the documentation.
I found the approach that helped the most was using an API Design tool like the OpenAPI format, and defining the routes based off my proposal features, then going through that as a list.

## Automated testing

I over engineered this aspect to the nth degree.
I tried to make EVERYTHING dynamic. Which of course made it way more complex.
Learned that optimization, especially premature optimization (in my case I was trying to optimize for lines of code, but created way more code and complexity that was not associated with the goal of the project) needs to be watched out for.

## Project management

Initially assumed I could get by on the mockups and my proposal alone, but needed to go a little deeper in terms of how my backend was to be structured.
Then tried using GitHub projects, but that was more complex than my use case needed, and needed to be updated multiple times to be useful.
Finally settled on designing my backend using the OpenApi spec based off the requirements in my proposal and mockup and working through it as a list.
