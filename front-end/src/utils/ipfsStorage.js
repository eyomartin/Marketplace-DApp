import * as Client from '@web3-storage/w3up-client'

export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

let client

async function initializeClient() {
  if (!client) {
    client = await Client.create()
    if (!Object.keys(client.accounts()).length) {
      const account = await client.login('marto.troshev@gmail.com')
      const space = await client.createSpace('my-space')
      await space.save()
      await account.provision(space.did())
    }
  }
  return client
}

export const ipfsSaveContent = async (file) => {
  console.log('Uploading file to IPFS with web3.storage...')
  console.log('File object received:', file)

  if (!(file instanceof File)) {
    throw new Error('Expected a File object. Make sure this comes from an <input type="file"> element.')
  }

  const client = await initializeClient()
  const root = await client.uploadDirectory([file])
  console.log('Stored file with CID:', root.toString())

  return root.toString()
}
