Based on the original repository from [ejmastnak](https://github.com/ejmastnak/ejmastnak.com). Thank You!




## Prerequisites

Ensure the following tools are installed:

- [Node.js](https://nodejs.org/) **v18** or newer
- [Hugo](https://gohugo.io/) **extended** edition version **0.111** or later

## Building

The website is built using the [Hugo static site generator](https://gohugo.io/). Once the prerequisites are met you can reproduce the website on your local computer as follows:

```bash
# Clone the website
git clone https://github.com/rickshf/rickshf.github.io

# Change into the website root directory
cd cd rickshf.github.io/

# Install Node packages (for TailwindCSS)
npm install

# Compile CSS stylesheets (this is a script defined in package.json)
npm run compile-tailwind

# Serve the website with Hugo
hugo serve

# The website should be available at localhost port 1313
xdg-open http://localhost:1313/
```

To generate a production build run:

```bash
hugo --minify
```

