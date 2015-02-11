test:
	mocha --recursive --reporter spec server/**/*.spec.js
.PHONY: test