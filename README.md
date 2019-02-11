## Getting Started
1. Install Node.js
2. Run
```
npm install -g yo cordova grunt-cli bower
npm install && bower install
install ruby
gem install compass
```

Build the project with `grunt build`.
Run `grunt serve` to run a watcher that rebuilds on file changes and has live reload. This should open a browser window at [http://127.0.0.1:9000/]

Run `cordova serve` to launch the Cordova web server. The page can be found at [http://localhost:8000/ios/].


### TODO Summary:

**Add NWAU15 and remove NWAU13 **

- Done
    - Enable ui to select NWAU15 and remove NWAU14

- TODO
    - Need to add json data for NWAU15, Under "app/ihpa" folder, add 1516 json files for each type of json data

**Allow facility level length of stay data to be removed and the application will adapt accordingly**

- Done
    - Allow length of stay to be empty

- TODO
    - Found calculator in calculator.service.js, there are 5 functions using LOS(length of stay), todo comments is added
    - Need to find out any other function using LOS
    - Need to build test for the calculator after update

**Remove "unbundled ICU Average" data**

- TODO
    - Need more explain: unbundled ICU Average?

**Don't display ICU notifications for NWAU15 calculations**

- TODO
    - Which ICU notifications need to hide?


