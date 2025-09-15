# SonarQube Scan Action

## Contributing

If you would like to see a new feature, please create a new thread in the forum ["Suggest new features"](https://community.sonarsource.com/c/suggestions/features).

Please be aware that we are not actively looking for feature contributions. The truth is that it's extremely difficult for someone outside SonarSource to comply with our roadmap and expectations. Therefore, we typically only accept minor cosmetic changes and typo fixes.

### Submitting a pull request

With that in mind, if you would like to submit a code contribution, please create a pull request for this repository. Please explain your motives to contribute this change: what problem you are trying to fix, what improvement you are trying to make.

Make sure that you follow our [code style](https://github.com/SonarSource/sonar-developer-toolset#code-style) and all tests are passing (Travis build is executed for each pull request).

### Next steps

One of the members of our team will carefully review your pull request. You might be asked at this point for clarifications or your pull request might be rejected if we decide that it doesn't fit our roadmap and vision for the product.
If your contribution looks promising then either we will decide:

- it is good to go and merge your pull request to the master branch

or

- that we need to think over your change and modify it to adhere to our roadmap and internal standards. We will close your pull request at this point, but we might come back to your changes later in the future when we decide it is the right time to work on it.

Thank You!  
The SonarSource Team

## Development

Both the main action and the secondary _install-build-wrapper_ action are [Javascript actions](https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action). They need to be packaged to work properly. We follow the official guidelines and rely on rollup for that.

### Requirements

Make sure you have node 20 & npm installed. We recommend using [nvm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm) for that.

### Building & testing

You'll first need to install dependencies:

```sh
npm install
```

To use rollup to bundle the scripts, run the `build` command:

```sh
npm run build
```

> ⚠️ Since the action uses the code in the repository, it is necessary to commit the bundled code! ⚠️


To run the js unit tests, run the `test` command:

```sh
npm run test
``` 
