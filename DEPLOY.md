# Deploying to Netlify

1. Add the four woff2 files to `fonts/` (see fonts/README.txt).
2. Open main.js and replace WEB3FORMS_ACCESS_KEY with the key emailed to
   rkturenakx@gmail.com from web3forms.com.
3. Go to app.netlify.com/drop and drag THIS FOLDER onto the page.
   No build step, no framework, no environment variables.
4. Send a test enquiry through the contact form and confirm it arrives.

## When you attach a real domain
Change the two URL lines in each HTML file:
  index.html      -> link rel="canonical" and meta property="og:url"
  compliance.html -> link rel="canonical"
They currently read https://rkturenakx.netlify.app/

## Files
  index.html            the site
  compliance.html       the fifteen policies, deep-linkable and printable
  styles.css            all colour, type and layout
  main.js               header, menu, tabs, contact form, WebGL hero
  journey.js            the hiring-journey animation
  favicon.svg
  logo-mark.png         navy mark, for light backgrounds
  logo-mark-light.png   bone mark, for the dark hero and footer
  netlify.toml          caching and security headers
  fonts/                Sora and Inter, self-hosted
