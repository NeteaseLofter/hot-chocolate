<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button  v-on:click=" isShow=!isShow" >点击我出现小惊喜卡卡</button>
    <p  v-if="isShow">congratulation </p>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data: () =>{
    return {
      isShow: false
    }
  },
  props: {
    msg: String
  },

  
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
button {
    background-color: paleturquoise;
    border-color: white;
    padding: 15px 32px;
    text-align: center;
    display: inline-block;
    font-size: 16px;
    border-radius:10px 100px / 120px;
    outline:none
}



</style>
