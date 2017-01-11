const breadcrumbs = require('./breadcrumbs');
const fetch = require('node-fetch');
const pageTemplate = require('./pageTemplate');
const topicLinks = require('./topicLinks');
const wiki = require('../wiki');

/*
 * Return a formatted version of the wiki page indicated by the given HTTP
 * request.
 */
module.exports = (request) => {

  const title = request.params.title;
  const topic = wiki.unescapePageTitle(title);
  const query = `${wiki.restUrl}?spaceKey=DB&title=${title}&expand=space,ancestors,body.view`;

  console.log(`Page: ${query}`);
  const pagePromise = fetch(query).then(response => response.json());
  const topicLinksPromise = topicLinks(topic);

  return Promise.all([pagePromise, topicLinksPromise])
  .then(values => {
    const json = values[0];
    const formattedTopicLinks = values[1];
    const result = json.results instanceof Array ? json.results[0] : json;
    const area = result.ancestors[0] ?
      result.ancestors[0].title :
      result.title;
    const pageMarkup = result.body.view.value;
    const pageMarkupWithLinks = pageMarkup.replace('<em>(Topic links go here)</em>', formattedTopicLinks);
    const body = wiki.rewriteHtml(pageMarkupWithLinks);
    const data = {
      area: area,
      breadcrumbs: breadcrumbs(result.ancestors),
      body: body,
      title: result.title
    };
    return pageTemplate(request, data);
  });
};
