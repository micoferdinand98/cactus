/**
 * Tests to check the BLP framework functions included in this package.
 * Client applications can use this framework when developing own client side apps (BLP).
 */

// Contants
const testLogLevel: LogLevelDesc = "info";
const sutLogLevel: LogLevelDesc = "info";
const setupTimeout = 1000 * 60; // 1 minute timeout for setup
const firstServiceName = "firstBLPServiceID";
const secondServiceName = "secondBLPServiceID";

/**
 * Mock cmd-socketio-server configuration that will be used by the test.
 * Normally, this would come from parsing config files in `/etc/cactus/`
 */
const mockAppConfig = {
  blpRegistry: [
    {
      businessLogicID: firstServiceName,
      validatorID: [],
    },
    {
      businessLogicID: secondServiceName,
      validatorID: [],
    },
  ],
  logLevel: sutLogLevel,
  applicationHostInfo: { hostName: "0.0.0.0", hostPort: 0 },
  socketOptions: {
    rejectUnauthorized: false,
    reconnection: false,
    timeout: 20000,
  },
  verifier: { maxCounterRequestID: 100, syncFunctionTimeoutMillisecond: 5000 },
  appRouters: [],
};

// Must be mocked before loading cactus-cmd-socketio-server
import * as ConfigUtil from "../../../main/typescript/routing-interface/util/ConfigUtil";
jest.mock("../../../main/typescript/routing-interface/util/ConfigUtil");
(ConfigUtil as any)["__configMock"] = mockAppConfig;

jest.mock("fs");

import { BusinessLogicBase } from "../../../main/typescript/business-logic-plugin/BusinessLogicBase";
import { LedgerEvent } from "../../../main/typescript/verifier/LedgerPlugin";
import { TransactionManagement } from "../../../main/typescript/routing-interface/TransactionManagement";
import { startCactusSocketIOServer } from "../../../main/typescript/routing-interface/CactusSocketIOServer";

import {
  Logger,
  LoggerProvider,
  LogLevelDesc,
} from "@hyperledger/cactus-common";

import { createHttpTerminator } from "http-terminator";
import { Request } from "express";
import http from "http";
import "jest-extended";

// Unit Test logger setup
const log: Logger = LoggerProvider.getOrCreate({
  label: "cmd-socketio-blp-plugin.test",
  level: testLogLevel,
});

//////////////////////////////
// Mock BLP Class
//////////////////////////////

/**
 * Returns predefined responses for certain operations that can be then validated in by the test suite.
 * Performs some validations of the input parameters as well.
 */
export class TestBLPService extends BusinessLogicBase {
  blpClassName: string;

  /**
   * Mocked value of ledger transaction ID that belongs to this BLP logic.
   * Assume it was received from another call to the ledger (`sendTransaction()` or something similar).
   */
  txName: string;

  /**
   * List of tradeID generated by the TransactionManagement component.
   * Should correspond to each `startBusinessLogic()` call.
   */
  transactions: string[] = [];

  /**
   * List of received event IDs by `onEvent()` function.
   */
  receivedEvents: string[] = [];

  constructor(public businessLogicID: string) {
    super();
    this.blpClassName = this.constructor.name;
    this.txName = `${businessLogicID}_TxID1`;
    log.debug(`${this.blpClassName} of ${businessLogicID} created.`);
  }

  /**
   * Called after receiving startBusinessLogic request in TransactionManagement.
   * Should register new trade start.
   *
   * @param req HTTP request that triggered this operation.
   * @param businessLogicID should be equal to this plugin ID.
   * @param tradeID New trade ID generated by TransactionManagement.
   */
  startTransaction(req: Request, businessLogicID: string, tradeID: string) {
    log.info(
      `${this.blpClassName}: [startTransaction] businessLogicID: ${businessLogicID}, tradeID: ${tradeID}`,
    );
    expect(req).toBeTruthy();
    expect(businessLogicID).toBeTruthy();
    expect(businessLogicID).toEqual(this.businessLogicID);
    expect(tradeID).toBeTruthy();
    this.transactions.push(tradeID);
    log.debug(
      "Added new transaction (trade). Current transactions:",
      this.transactions,
    );
  }

  /**
   * Should return status of the trade given in argument.
   *
   * @param tradeID Status we want to get.
   * @returns response: true if routed to correct BLP, businessLogicID: this BLP id
   */
  getOperationStatus(tradeID: string) {
    log.info(
      `${this.blpClassName}: [getOperationStatus] businessLogicID: ${this.businessLogicID}, tradeID: ${tradeID}`,
    );
    expect(tradeID).toBeTruthy();
    const isIncluded = this.transactions.includes(tradeID);
    expect(isIncluded).toBeTrue();
    return { response: isIncluded, businessLogicID: this.businessLogicID };
  }

  /**
   * Should be used for BLP logic setup by the client.
   * @param meterParams some BLP options.
   * @returns meterParams: received in input, businessLogicID: this BLP id
   */
  setConfig(meterParams: string[]): any {
    log.info(
      `${this.blpClassName}: [setConfig] businessLogicID: ${this.businessLogicID}, meterParams: ${meterParams}`,
    );
    expect(meterParams).toBeTruthy();
    return { meterParams, businessLogicID: this.businessLogicID };
  }

  /**
   * Used to receive events from the verifier. Events should be routed correctly based on responses
   * from other methods in this BLP. Pushes new event to `receivedEvents`.
   *
   * Current flow of the event while being routed to the BLP (implemented in TransactionManagement,
   * but described here for test setup clarity):
   * 1. `getEventDataNum(ledgerEvent)` is called for each registered BLP, until one of them returns event count different from `0`.
   * 2. `getTxIDFromEvent(ledgerEvent, targetIndex)` is called for each registered BLP, until one of them returns
   *  transaction id different from `null`.
   * 3. `hasTxIDInTransactions(txID)` is called for each registered BLP, until one of them confirms it's
   *  an owner of given transaction. For single-BLP, this function can be ommited and will return true (for backward compatibility).
   * 4.  `onEvent(ledgerEvent, targetIndex)` - this function is called.
   *
   * @param ledgerEvent Event that belong to this BLP.
   * @param targetIndex Index of the event (starting from `0`).
   */
  onEvent(ledgerEvent: LedgerEvent, targetIndex: number): void {
    log.info(
      `${this.blpClassName}: [onEvent] businessLogicID: ${this.businessLogicID}, ledgerEvent: ${ledgerEvent}, targetIndex: ${targetIndex}`,
    );
    expect(ledgerEvent).toBeTruthy();
    expect(targetIndex).toEqual(0);
    expect(ledgerEvent.data).toEqual(this.businessLogicID);
    this.receivedEvents.push(ledgerEvent.id);
    log.debug("Added new event. Current event IDs:", this.receivedEvents);
  }

  /**
   * Should return number of events from given LedgerEvent.
   * This test implementation always returns 1.
   *
   * @returns 1
   */
  getEventDataNum() {
    log.info(
      `${this.blpClassName}: [getEventDataNum] businessLogicID: ${this.businessLogicID}`,
    );
    return 1;
  }

  /**
   * Should read ledger transaction id from given LedgerEvent.
   * It returns either predefined `this.txName` if event matches this BLP, or `null` if not.
   * @param ledgerEvent
   * @returns
   */
  getTxIDFromEvent(ledgerEvent: LedgerEvent<any>) {
    log.info(
      `${this.blpClassName}: [getTxIDFromEvent] businessLogicID: ${this.businessLogicID}, ledgerEvent: ${ledgerEvent}`,
    );

    if (ledgerEvent.data === this.businessLogicID) {
      log.debug("Event matches, return txName");
      return this.txName;
    } else {
      return null;
    }
  }

  /**
   * Should return true if given ledger transaction belongs to this BLP.
   *
   * @param txID ledger transaction ID.
   * @returns `true` if given txID matches predefined `this.txName`, `false` otherwise.
   */
  hasTxIDInTransactions(txID: string) {
    return txID === this.txName;
  }
}

//////////////////////////////
// Test Suite
//////////////////////////////

describe("Test multiple Bussiness Logic Plugins (BLP) running as a single service", () => {
  const firstService = new TestBLPService(firstServiceName);
  const secondService = new TestBLPService(secondServiceName);
  let transactionManagement: TransactionManagement;
  let cmdServer: http.Server;

  //////////////////////////////
  // Setup
  //////////////////////////////

  beforeAll((done) => {
    transactionManagement = new TransactionManagement();

    const blpConfig = [
      {
        id: firstServiceName,
        plugin: firstService,
      },
      {
        id: secondServiceName,
        plugin: secondService,
      },
    ];
    log.info(
      "Create CMD SocketIO Server with the following BLP config:",
      blpConfig,
    );

    cmdServer = startCactusSocketIOServer(blpConfig, () => {
      expect(cmdServer).toBeTruthy();
      const addr = cmdServer.address();
      expect(addr).toBeTruthy();
      const bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr!.port;
      log.info("Test CMD SocketIO Server started at", bind);
      done();
    });
  }, setupTimeout);

  afterAll(async () => {
    if (cmdServer) {
      log.info("Stop CMD SocketIO Server");
      const httpTerminator = createHttpTerminator({
        server: cmdServer,
      });
      await httpTerminator.terminate();
    }

    log.info("Cleanup done.");
  }, setupTimeout);

  //////////////////////////////
  // Tests
  //////////////////////////////

  test("Start bussiness logic creates new trade and calls correct BLP", () => {
    // First BLP
    const reqMockFirst = {
      body: {
        businessLogicID: firstServiceName,
      },
    };
    const firstTradeID = transactionManagement.startBusinessLogic(
      reqMockFirst as any,
    );
    expect(firstTradeID).toBeTruthy();
    expect(firstService.transactions).toInclude(firstTradeID as string);

    // Second BLP
    const reqMockSecond = {
      body: {
        businessLogicID: secondServiceName,
      },
    };
    const secondTradeID = transactionManagement.startBusinessLogic(
      reqMockSecond as any,
    );
    expect(secondTradeID).toBeTruthy();
    expect(secondService.transactions).toInclude(secondTradeID as string);
  });

  test("Calling getOperationStatus gets status from correct BLP", () => {
    // First BLP
    const reqMockFirst = {
      body: {
        businessLogicID: firstServiceName,
      },
    };
    const firstTradeID = transactionManagement.startBusinessLogic(
      reqMockFirst as any,
    ) as any;
    const firstTradeStatus = transactionManagement.getOperationStatus(
      firstTradeID,
    ) as any;
    expect(firstTradeStatus).toBeTruthy();
    expect(firstTradeStatus.businessLogicID).toEqual(firstServiceName);
    expect(firstTradeStatus.response).toBeTrue();

    // Second BLP
    const reqMockSecond = {
      body: {
        businessLogicID: secondServiceName,
      },
    };
    const secondTradeID = transactionManagement.startBusinessLogic(
      reqMockSecond as any,
    ) as any;
    const secondTradeStatus = transactionManagement.getOperationStatus(
      secondTradeID,
    ) as any;
    expect(secondTradeStatus).toBeTruthy();
    expect(secondTradeStatus.businessLogicID).toEqual(secondServiceName);
    expect(secondTradeStatus.response).toBeTrue();
  });

  test("Calling setBusinessLogicConfig sends request to correct BLP", () => {
    // First BLP
    const firstMeterParams = ["a", "b", "c"];
    const reqMockFirst = {
      body: {
        businessLogicID: firstServiceName,
        meterParams: firstMeterParams,
      },
    };
    const firstSetResponse = transactionManagement.setBusinessLogicConfig(
      reqMockFirst as any,
    ) as any;
    expect(firstSetResponse).toBeTruthy();
    expect(firstSetResponse.businessLogicID).toEqual(firstServiceName);
    expect(firstSetResponse.meterParams).toEqual(firstMeterParams);

    // Second BLP
    const secondMeterParams = ["x", "y", "z"];
    const reqMockSecond = {
      body: {
        businessLogicID: secondServiceName,
        meterParams: secondMeterParams,
      },
    };
    const secondSetResponse = transactionManagement.setBusinessLogicConfig(
      reqMockSecond as any,
    ) as any;
    expect(secondSetResponse).toBeTruthy();
    expect(secondSetResponse.businessLogicID).toEqual(secondServiceName);
    expect(secondSetResponse.meterParams).toEqual(secondMeterParams);
  });

  test("Events are routed to the correct BLP", () => {
    // First BLP
    const firstEventId = "someEventForFirstService";
    const firstLedgerEvent = {
      id: firstEventId,
      verifierId: "someVerifier",
      data: firstServiceName,
    };
    transactionManagement.onEvent(firstLedgerEvent);
    expect(firstService.receivedEvents.length).toBeGreaterThan(0);
    expect(firstService.receivedEvents[0]).toEqual(firstEventId);

    // Second BLP
    const secondEventId = "someEventForSecondService";
    const secondLedgerEvent = {
      id: secondEventId,
      verifierId: "someVerifier",
      data: secondServiceName,
    };
    transactionManagement.onEvent(secondLedgerEvent);
    expect(secondService.receivedEvents.length).toBeGreaterThan(0);
    expect(secondService.receivedEvents[0]).toEqual(secondEventId);
  });
});
