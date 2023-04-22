import { exec } from 'child_process';


const [, , ...args] = process.argv;

if (args.length !== 1) {
    throw new Error('You must provide a single argument');
}

const [fileName] = args;


// run the fileName script

// Replace "path/to/your/file.js" with the path to your Node.js file
exec(`node ./builds/scripts/${fileName}`, (error: any, stdout: any, stderr: any) => {
    console.log("RUNNING");
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(stdout);
    console.error(stderr);
});