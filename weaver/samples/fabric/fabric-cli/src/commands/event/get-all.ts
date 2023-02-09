/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { GluegunCommand } from 'gluegun'
import { fabricHelper, getKeyAndCertForRemoteRequestbyUserName } from '../../helpers/fabric-functions'
import logger from '../../helpers/logger'
import { Utils, ICryptoKey } from 'fabric-common'
import { commandHelp, getNetworkConfig, handlePromise } from '../../helpers/helpers'
import { EventsManager } from '@hyperledger-labs/weaver-fabric-interop-sdk'
import { EventSubscriptionState, EventType } from "@hyperledger-labs/weaver-protos-js/common/events_pb";
import * as fs from 'fs'
import * as path from 'path'

const command: GluegunCommand = {
  name: 'get-all',
  alias: ['-gall'],
  description: 'Get all received event states',
  run: async toolbox => {
    const {
      print,
      parameters: { options, array }
    } = toolbox
    if (options.help || options.h) {
      commandHelp(
        print,
        toolbox,
        `fabric-cli event get-all --network=<network1|network2> --request-id="abc123"`,
        'fabric-cli event get-all --network=<network-name> --request-id=<request_id>',
        [
            {
                name: '--network',
                description:
                    'Local network for command. <network1|network2>'
            },
            {
                name: '--request-id',
                description:
                    'Request ID received during subscription.'
            },
            {
                name: '--debug',
                description:
                    'Shows debug logs when running. Disabled by default. To enable --debug=true'
            }
        ],
        command,
        ['event', 'get-all']
      )
      return
    }
    console.log("Get All Received Event States")
    if (options.debug === 'true') {
        logger.level = 'debug'
        logger.debug('Debugging is enabled')
    }
    if (!options['network'])
    {
      print.error('--network needs to be specified')
      return
    }
    if (!options['request-id'])
    {
      print.error('--request-id needs to be specified')
      return
    }
    const networkName = options['network']
    const requestId = options['request-id']
    
    const netConfig = getNetworkConfig(networkName)
    if (!netConfig.connProfilePath || !netConfig.channelName || !netConfig.chaincode) {
        throw new Error(`No valid config entry found for ${networkName}`)
    }
    try {
        const response = await EventsManager.getAllReceivedEvents(
            requestId,
            netConfig.relayEndpoint
        )
        console.log("Event States:", JSON.stringify(response, null, 4))
    } catch(e) {
        console.log("Error: ", e.toString())
    }

    process.exit()
  }
}


module.exports = command
