# html-photo-frame

A photo frame app that can be used by any browser.

* frontend only, you create the JSON file that lists images
  and configures the slideshow,
* HTML, CSS and pure JS.

# Setup

Create a JSON file like this:

```json
{
  "images": [
    {"url": "https://example.com/image.jpg"}
  ],
  "timeout": 5000
}
```

The images **must** have a `url`, and
can have a `caption`, which will be used in place of the URL
if the user activates captions (see keybindings).

Open html-photo-frame with the JSON file's URL as
a parameter: `https://example.com/photo-frame/index.html?json=slides.json`

# Features

* shows photos in a loop,
* configurable wait time between changes,
* controllable via keybindings.

# Keybindings

* "c" - toggle caption (filename) visibility,
* "f" - toggle "focus mode" - show only the photos from the same path as the current one,
* "h" - show/hide the list of keybindings,
* "l" - get the list of noted photos (see "n"),
* "n" - add current image URL to list of notes,
* "q" - be less verbose,
* "r" - reset the list of noted photos (see "n"),
* "v" - be more verbose,
* "&lt;del>" - remove a photo from the list,
* "&lt;spacebar>" - pause,
* "←" - go back,
* "→" - go forwards,
* "-" - slow down slide changes,
* "+" - speed up slide changes.

# Development

```bash
docker build --tag html-photo-frame/dev-webserver:latest --file docker/webserver.Dockerfile .
docker run --rm -ti --volume $PWD:/app --publish 9080:9080 html-photo-frame/dev-webserver:latest
```

Create a file `conf.json` with the list of photos to view.

```
http://localhost:9080/?config=conf.json
```

## Tests

Run tests with

```bash
docker-compose --file cypress/docker/docker-compose.yml --project-name html-photo-frame run --rm cypress
```
