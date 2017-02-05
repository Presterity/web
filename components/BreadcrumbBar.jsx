import { Component, h } from 'preact'; // jshint ignore:line
const wiki = require('../server/connectors/wiki');


/**
 * Breadcrumb bar
 */
export default class BreadcrumbBar extends Component {

  render(props) {

    // TODO: Add ' / ' ::before the breadcrumbs.
    const ancestors = props.ancestors || [];
    const breadcrumbs = ancestors.map(ancestor => {
      const title = ancestor.title;
      const siteUrl = wiki.pageTitleToSiteUrl(title);
      return (
        <a href={siteUrl}>{title}</a>
      );
    });

    return (
      <div class="breadcrumbs">{breadcrumbs}</div>
    );
  }

}