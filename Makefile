.DEFAULT_GOAL := help

NPM ?= npm
NPX ?= npx

.PHONY: help install dev build serve test test-watch typecheck lint check clean nuke

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	$(NPM) install

dev: ## Run dev server on http://localhost:3000
	$(NPM) run dev

build: ## Produce static site in out/
	$(NPM) run build

serve: build ## Build then serve out/ on http://localhost:5000 for smoke testing
	$(NPX) serve -p 5000 out

test: ## Run unit tests once
	$(NPM) test

test-watch: ## Run unit tests in watch mode
	$(NPM) run test:watch

typecheck: ## tsc --noEmit
	$(NPX) tsc --noEmit

lint: ## next lint
	$(NPM) run lint

check: typecheck lint test ## Run all gates locally before pushing

clean: ## Remove build artefacts
	rm -rf .next out

nuke: clean ## Remove node_modules too
	rm -rf node_modules
