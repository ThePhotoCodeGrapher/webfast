# WebFast! **DEV**

WebFast! is a lightweight, model-based framework developed by Hybrid Institute. It is designed for individuals who are interested in building no-code/low-code solutions and prefer an easy-to-setup development environment.

## Introduction

WebFast! provides a flexible and intuitive platform for creating web applications without the need for extensive coding. It empowers users to leverage a model-based approach, making it accessible to a broader audience, including those with limited coding experience.

## Telegram Community Group
Join the [WebFast! Telegram Community](https://t.me/webfast_community) for quick questions and further discussion of development of the webFast! Framework.

## Features

- **Lightweight**: Keep your projects streamlined with a minimalistic approach.
- **Model-Based**: Design and structure your applications using a model-driven paradigm.
- **No-Code/Low-Code**: Build powerful applications with ease, even if you have limited coding experience.
- **Easy to Setup**: Get started quickly with a straightforward setup process.

## Getting Started

### Prerequisites

- Node.js: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/ThePhotoCodeGrapher/webfast.git
    ```

2. Navigate to the project directory:

    ```bash
    cd WebFast!
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Configure the port:

    - The default port is set to **1221** and can be changed in the file `/modules/express/init.js`. Open this file and modify the `PORT` variable according to your preference.

5. Start the development server:

    ```bash
    npm start
    ```

6. Open your browser and visit [http://localhost:1221/api](http://localhost:1221/api) to explore the dynamically structured API endpoints based on your modules in `/modules/express/routes`.

   - **Example Endpoint Structure**:
     - `/api/example/link` (from `link.get.js` in `/modules/express/example`)
     - `/api/example/{FOLDER_NAME}/{FILE_OR_FOLDER_NAME}` (based on your project structure)

## Contributing

We welcome contributions from the community. If you'd like to contribute to WebFast!, please follow our [contribution guidelines](CONTRIBUTING.md).

## Modules

### Generator Module

The `generator` module is an object-based component of WebFast! that allows you to extend the functionality based on your specific requirements. This module will be automatically executed, taking into account its dependencies.

#### Dependencies

- `express.app`: This module is a prerequisite for the `generator` module.

#### Usage

The `generator` module exports an object with the following structure:

```javascript
module.exports = {
    dependOn: ['express.app'],
    name: 'generator',
    run: function (program, name) {
        console.log(`Running ${name}`);

        // Here we can do whatever like grab modules for generator and represent them here
    }
}

## Important Note on Including WebFast

When integrating WebFast into your project, consider the following instructions:

```javascript
// If you want to set up your own paths, add "paths: true" when requiring WebFast. 
// This will prompt WebFast to look for specific folders within your project directory.

const program = require('webfast')({
    paths: true,
    path: __dirname
});
```
In this configuration:

The paths: true option instructs WebFast to search for specific folders within the project directory.

The path: __dirname parameter sets the base directory for WebFast, where it will look for the following essential folders:

bots
ejs
routes
Within these folders, you can establish a dynamic setup, as exemplified in the module itself.

```
## program.modules.dependOn
example : 
```
module.exports = {
    dependOn: ['express.app','modules.data'],
    name: '{UNIQUE_NAME}',
    run: async function (program, name,functions) {
    },
    functions : {
    }
}
```
To add an dependOn function
```
program.modules.dependOn({REQUIRE},program,`{UNIQUE_NAME}-sync`,function(){
            console.log(`Depend On CallBack`);
});
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please feel free to [contact me on LinkedIn](https://linkedin.com/in/kaigartner). You can also reach out to me on Instagram: [@kaigartner](https://instagram.com/kaigartner).



---

**Hybrid Institute** - Empowering the future with innovative solutions.
