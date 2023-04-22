import { DoorDashClient, } from "@doordash/sdk";
import * as a from "@doordash/sdk";
// SS TO3n1VgkTKQTbe-4B6F6-3TyJzZzc-EviEhyD7AZWLE
// KID 7626eba8-9951-4f40-be90-6ca47eac1555
// DID d47ff47f-3a6e-4784-87a0-37fcf52c76eb


const doorDashClient = new DoorDashClient({
    signing_secret: "TO3n1VgkTKQTbe-4B6F6-3TyJzZzc-EviEhyD7AZWLE",
    key_id: "7626eba8-9951-4f40-be90-6ca47eac1555",
    developer_id: "d47ff47f-3a6e-4784-87a0-37fcf52c76eb",
});


export {
    doorDashClient,
}