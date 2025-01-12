import { createBdd } from "playwright-bdd";
import { test } from '../com.fixtures/fixtures';
import { expect } from '@playwright/test';

const{Given, When, Then} = createBdd(test);

Given('I navigate to {string}', async ({ecomLoginPage}, url) => {
    // Step: Given I navigate to "https://ecommerce-playground.lambdatest.io/"
    // From: ecomlogin.feature:9:3
    await ecomLoginPage.navigateToUrl(url);
  });
  
  Given('I click on {string}', async ({ecomLoginPage}) => {
    // Step: And I click on My account
    // From: ecomlogin.feature:10:3
    await ecomLoginPage.clickOnMyAccount();

  });
  
  Given('I enter E-Mail Address {string}', async ({ecomLoginPage}, emailAddress) => {
    // Step: And I enter E-Mail Address "pranav@testroverautomation.com"
    // From: ecomlogin.feature:11:3
    await ecomLoginPage.enterEmailAddress(emailAddress)  });
  
  Given('I enter password {string}', async ({ecomLoginPage}, password) => {
    // Step: And I enter password "Test1234"
    // From: ecomlogin.feature:12:3
    await ecomLoginPage.enterPassword(password);
  });
  
  When('I click on submit button', async ({ecomLoginPage}) => {
    // Step: When I click on submit button
    // From: ecomlogin.feature:13:6
    await ecomLoginPage.clickOnSubmitButton();
  });
  
  Then('I should verify url contains {string}', async ({ecomLoginPage}, logged_url) => {
    // Step: Then I should verify url contains "route=account/account"
    // From: ecomlogin.feature:14:3
    await ecomLoginPage.verifyUrlContains(logged_url);
  });
  
   Then('I should verify user is not able to login and url contains {string}', async ({ecomLoginPage}, logged_url) => {
   // Step: Then I should verify user is not able to login and url contains "route=account/login"
  //   // From: ecomlogin.feature:22:3
  await ecomLoginPage.verifyUserIsNotAbleToLoginAndUrlContains(logged_url);
   });