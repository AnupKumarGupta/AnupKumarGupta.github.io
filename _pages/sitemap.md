---
layout: archive
title: "Sitemap"
permalink: /sitemap/
author_profile: true
---

{% include base_path %}

A list of all the posts and pages found on the site. For you robots out there is an [XML version]({{ base_path }}/sitemap.xml) available for digesting as well.

<h2>Pages</h2>
{% assign sorted_pages = site.pages | sort: "title" %}
{% for post in sorted_pages %}
  {% include archive-single.html %}
{% endfor %}