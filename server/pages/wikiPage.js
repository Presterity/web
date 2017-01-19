const fetch = require('node-fetch');
const notFoundPage = require('./notFoundPage');
const pageTemplate = require('./pageTemplate');
const topicLinks = require('./topicLinks');
const wiki = require('../connectors/wiki');

/*
 * Return a formatted version of the wiki page indicated by the given HTTP
 * request.
 *
 * If the wiki page isn't found, this returns a "Not Found" page.
 */
module.exports = (request) => {

  const title = request.params.title;
  const topic = wiki.unescapePageTitle(title);
  const query = `${wiki.restUrl}?spaceKey=DB&title=${title}&expand=space,ancestors,body.view`;

  console.log(`Page: ${query}`);

  // Get the content of the corresponding wiki page.
  const pagePromise = fetch(query).then(response => response.json());

  // On pages in the /reference area, ask for bookmarks in the form of links.
  const isReferencePage = request.params.area === 'reference';
  const topicLinksPromise = isReferencePage ?
    topicLinks(topic) :
    Promise.resolve('');

  // Once we've got the wiki page and topic links, put the page together.
  return Promise.all([pagePromise, topicLinksPromise])
  .then(values => {

    const wikiResults = values[0]; // from pagePromise
    const topicLinksHtml = values[1]; // from topicLinksPromise

    const wikiPageJson = wikiResults.results instanceof Array ?
      wikiResults.results[0] :
      wikiResults;
    if (!wikiPageJson) {
      // We couldn't find a wiki page with that name.
      // Serve up a "Not found" page instead.
      return notFoundPage(request, topic);
    }

    // Extract the bits of the page we care about.

    let ancestors = wikiPageJson.ancestors;
    // Wiki pages with ancestors should act like they're under Home, with the
    // exception of Home itself.
    if (ancestors == null || ancestors.length === 0 && wikiPageJson.title !== 'Home') {
      ancestors = [{ title: 'Home' }];
    }

    const area = ancestors[0] ?
      ancestors[0].title :
      wikiPageJson.title;
    const title = wikiPageJson.title === 'Home' ?
      'Presterity' :
       `${wikiPageJson.title} - Presterity`;
    const heading = wikiPageJson.title === 'Home' ?
      'Presterity' :
      wikiPageJson.title;

    // The main page content with be the wiki page + formatted topic links.
    const wikiHtml = wikiPageJson.body.view.value;
    const mainPaneHtml = wikiHtml.replace('<em>(Topic links will automatically appear here.)</em>', topicLinksHtml);

    // The body will include link which are relative to the wiki.
    // We fix those up so they refer to URLs on our site instead.
    const body = wiki.rewriteHtml(mainPaneHtml);

    // Add a footer that's specific to the reference area.
    const footer = isReferencePage ?
      `
        <p>
          You can <a href="/Submissions">submit news</a> on this topic.
          If something's wrong on this page,
          <a href="/Volunteering">help us fix it</a>.
        </p>
        <p>
          This work is licensed under a
          <a rel="license" href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
        </p>
      ` :
      '';

    // Pour all that into our standard page template.
    return pageTemplate(request, {
      ancestors,
      area,
      body,
      footer,
      heading,
      title
    });
  });
};
