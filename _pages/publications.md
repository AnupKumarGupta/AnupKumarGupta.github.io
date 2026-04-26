---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% include base_path %}

<!-- *For a updated list of my publications, please visit my [Google Scholar](https://scholar.google.com/citations?user=yNhpJTAAAAAJ&hl=en) profile.* -->

{% assign sorted_papers = site.data.publications | sort: "year" | reverse %}

{% for paper in sorted_papers %}
* {{ paper.authors | replace: "Anup Kumar Gupta", "<span style='font-weight: 550;'>Anup Kumar Gupta</span>" }}. ``[{% if paper.link != empty and paper.link != nil %}{{ paper.title }}{% else %}{{ paper.title }}{% endif %}]({{ paper.link }})''. *{{ paper.venue }}*, {{ paper.year }}.
{% endfor %}