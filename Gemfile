source "https://rubygems.org"

# Use Jekyll 4.x for Ruby 4 compatibility
gem "jekyll", "~> 4.3"

# Essential libraries removed from Ruby 4 core
gem "webrick", "~> 1.8"
gem "csv", "~> 3.3"
gem "bigdecimal", "~> 3.1"

# Essential plugins for your research profile
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-redirect-from", "~> 0.16"
  gem "jekyll-gist", "~> 1.5"
  gem "jekyll-target-blank", "~> 2.0"
end

gem "wdm", "~> 0.1.1" if Gem.win_platform?