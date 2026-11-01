FROM ruby:3.4.8-slim

ENV RAILS_ENV=production \
    BUNDLE_WITHOUT=development:test \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    RAILS_SERVE_STATIC_FILES=true

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends build-essential curl libyaml-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Gems first so a code change does not reinstall them.
COPY Gemfile Gemfile.lock ./
RUN bundle install && rm -rf /usr/local/bundle/cache

# The application, including the vendored Monaco build and the committed
# collaboration bundle under public/. No Node toolchain is needed to serve it.
COPY . .

RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

EXPOSE 3000
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
