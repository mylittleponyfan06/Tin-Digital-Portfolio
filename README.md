# Digital Portfolio

A clean, responsive personal portfolio to showcase artsy / creative projects, coding work, and background info.

## Structure
- `index.html` – Landing page with featured projects.
- `art-projects.html` – Guitar mods, gigs, creative builds.
- `code-projects.html` – Software / coding projects.
- `about.html` – Bio, education, skills.
- `assets/css/style.css` – Global styles.
- `assets/js/` – Page scripts + shared utilities.
- `data/` – JSON data you can edit without touching markup.

## Editing Content
Update projects / skills / education by editing JSON files in `data/`. Add new fields like `links` or `image` as needed.

Example project:
```json
{
  "title": "School FSDP Website",
  "subtitle": "Full-stack project with auth & dashboard",
  "tags": ["web", "school", "fullstack"],
  "featured": true,
  "image": "assets/images/fsdp.png",
  "links": { "github": "https://github.com/you/repo", "demo": "https://demo.example.com" }
}
```

## Running Locally
Because modules + fetch need a server, start a simple local server:

### Python (if installed)
`python -m http.server 5173`

Then open: http://localhost:5173

### Node (npx)
`npx serve .`

### VS Code Extension
Use the "Live Server" extension and click "Go Live".

## Customization Ideas
- Add dark/light toggle
- Add a dedicated project detail page template
- Add contact form (with a serverless service)
- Integrate GitHub API for latest commits

## License
MIT (modify freely)
