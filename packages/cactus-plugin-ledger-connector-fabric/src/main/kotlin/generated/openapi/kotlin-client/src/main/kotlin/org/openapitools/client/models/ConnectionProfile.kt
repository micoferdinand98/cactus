/**
 * Hyperledger Cactus Plugin - Connector Fabric
 *
 * Can perform basic tasks on a fabric ledger
 *
 * The version of the OpenAPI document: 0.0.1
 * 
 *
 * Please note:
 * This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * Do not edit this file manually.
 */

@file:Suppress(
    "ArrayInDataClass",
    "EnumEntryName",
    "RemoveRedundantQualifierName",
    "UnusedImport"
)

package org.openapitools.client.models

import org.openapitools.client.models.ConnectionProfileClient

import com.squareup.moshi.Json

/**
 * 
 *
 * @param name 
 * @param version 
 * @param organizations 
 * @param peers 
 * @param xType 
 * @param description 
 * @param client 
 * @param channels 
 * @param orderers 
 * @param certificateAuthorities 
 */

data class ConnectionProfile (

    @Json(name = "name")
    val name: kotlin.String,

    @Json(name = "version")
    val version: kotlin.String,

    @Json(name = "organizations")
    val organizations: kotlin.collections.Map<kotlin.String, kotlin.Any>,

    @Json(name = "peers")
    val peers: kotlin.collections.Map<kotlin.String, kotlin.Any>,

    @Json(name = "x-type")
    val xType: kotlin.String? = null,

    @Json(name = "description")
    val description: kotlin.String? = null,

    @Json(name = "client")
    val client: ConnectionProfileClient? = null,

    @Json(name = "channels")
    val channels: kotlin.collections.Map<kotlin.String, kotlin.Any>? = null,

    @Json(name = "orderers")
    val orderers: kotlin.collections.Map<kotlin.String, kotlin.Any>? = null,

    @Json(name = "certificateAuthorities")
    val certificateAuthorities: kotlin.collections.Map<kotlin.String, kotlin.Any>? = null

) : kotlin.collections.HashMap<String, kotlin.Any>()

