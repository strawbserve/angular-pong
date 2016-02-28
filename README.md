# angular-pong
## Pong in AngularJS

I wanted to play with AngularJS without having a "useyness" agenda (i.e. doing something that I might regret not finishing) and thought it might be fun to implement Pong.\*

Try it out here: http://www.byager.com/angular-pong/pong.html

<sub>\* If I'm stepping on anybody's intellectual property toes with this let me know and I will cease and desist immediately.</sub>

BUGS:
- The computer player in one-player mode is still jittery. It should be beatable but that may vary depending on the host computer's performance. I put off working on the computer player algorithm because it was eating time and my goal is to learn to do things "the angular way". I have some ideas but none of them are really AngularJS specific. I'll get to it when I get to it. Feel free to contribute one. :)

NOTES:

- still considering going back to a flat file structure (all files in one directory)

TODO:

- work on modularity
  - ball/paddle functionality in `serve()`
  - key capture module?
- download angular and bootstrap files and get off CDNs
- one player mode: work on better algorithm
- add left serve key
- add multiplayer with web sockets?
- make it work on phones
- settings:
  - "play to" score (acknowledge winner?)
  - set control keys
