var should = require('should');

var Class = require('../../lib/types/time');

describe('Time', function(){
  isUsedHelper(Class, ['time', 'times'], [{week:23}, {year:2013}]);

  var now = new Date();
  var current = {
    Y: now.getFullYear(),
    M: now.getMonth(),
    D: now.getDate(),
    W: now.getDay(),
    h: now.getHours(),
    m: now.getMinutes()
  };

  describe('#filter()', function(){  
    //year
    filterHelper(Class, {time: {year: current.Y}},                                          {username: 'phil'}, true);
    filterHelper(Class, {times: {year: current.Y + '-' + (current.Y + 1)}},                 {username: 'phil'}, true);
    filterHelper(Class, {time: [{year: current.Y}, {year: current.Y - 1}]},                 {username: 'phil'}, true);
    filterHelper(Class, {times: [{year: 2000}, {year: (current.Y - 1) + '-' + current.Y}]}, {username: 'phil'}, true);
    
    //month
    filterHelper(Class, {time: {month: current.M}},                                                    {username: 'phil'}, true);
    filterHelper(Class, {times: {month: current.M + '-' + (current.M + 1)}},                           {username: 'phil'}, true);
    filterHelper(Class, {time: [{month: current.M}, {month: current.M - 1}]},                          {username: 'phil'}, true);
    filterHelper(Class, {times: [{month: current.M - 2}, {month: (current.M - 1) + '-' + current.M}]}, {username: 'phil'}, true);
    
    //day
    filterHelper(Class, {time: {day: current.D}},                                                  {username: 'phil'}, true);
    filterHelper(Class, {times: {day: current.D + '-' + (current.D + 1)}},                         {username: 'phil'}, true);
    filterHelper(Class, {time: [{day: current.D}, {day: current.D - 1}]},                          {username: 'phil'}, true);
    filterHelper(Class, {times: [{day: current.D - 2}, {day: (current.D - 1) + '-' + current.D}]}, {username: 'phil'}, true);
    
    //week day
    filterHelper(Class, {time: {weekday: current.W}},                                                      {username: 'phil'}, true);
    filterHelper(Class, {times: {weekday: current.W + '-' + (current.W + 1)}},                             {username: 'phil'}, true);
    filterHelper(Class, {time: [{weekday: current.W}, {weekday: current.W - 1}]},                          {username: 'phil'}, true);
    filterHelper(Class, {times: [{weekday: current.W - 2}, {weekday: (current.W - 1) + '-' + current.W}]}, {username: 'phil'}, true);
    
    //hour
    filterHelper(Class, {time: {hour: current.h}},                                                   {username: 'phil'}, true);
    filterHelper(Class, {times: {hour: current.h + '-' + (current.h + 1)}},                          {username: 'phil'}, true);
    filterHelper(Class, {time: [{hour: current.h}, {hour: current.h - 1}]},                          {username: 'phil'}, true);
    filterHelper(Class, {times: [{hour: current.h - 2}, {hour: (current.h - 1) + '-' + current.h}]}, {username: 'phil'}, true);
    
    //minute
    filterHelper(Class, {time: {minute: current.m}},                                                     {username: 'phil'}, true);
    filterHelper(Class, {times: {minute: current.m + '-' + (current.m + 1)}},                            {username: 'phil'}, true);
    filterHelper(Class, {time: [{minute: current.m}, {minute: current.m - 1}]},                          {username: 'phil'}, true);
    filterHelper(Class, {times: [{minute: current.m - 2}, {minute: (current.m - 1) + '-' + current.m}]}, {username: 'phil'}, true);
    
    
    //mixed
    filterHelper(Class, {time: {year: current.Y, month: current.M, hour: current.h}},           {username: 'phil'}, true);
    filterHelper(Class, {time: {day:(current.D - 1) + '-' + (current.D + 1), hour: current.h}}, {username: 'phil'}, true);
    filterHelper(Class, {time: {year: current.Y, month: current.M, hour: current.h - 1}},       {username: 'phil'}, false);
    filterHelper(Class, {time: {year: current.Y, month: current.M, weekday: current.W + 2}},    {username: 'phil'}, false);
    filterHelper(Class, {time: {weekday:'Mo-Fr'}},                                              {username: 'phil'}, false);
  });

});