---
layout: archive
title: "Talks"
permalink: /talks/
author_profile: true
---

{% include base_path %}

<!-- {% if site.talkmap_link == true %}

<p style="text-decoration:underline;"><a href="/talkmap.html">See a map of all the places I've given a talk!</a></p>

{% endif %} -->


{% assign sorted_talks = site.data.talks | sort: "date" | reverse %}

{% for talk in sorted_talks %}
* **{{ talk.speaker }}**: `` [{{ talk.title }}]({% if talk.link != empty and talk.link != nil %}{{ talk.link }}{% else %}#{% endif %}), *{{ talk.event }}*, {{ talk.venue }}, {{ talk.location }}, {{ talk.date | date: "%B %Y" }}.
{% endfor %}
